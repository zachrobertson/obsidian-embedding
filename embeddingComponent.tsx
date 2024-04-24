import React from 'react';
import { Trash } from 'lucide-react';
import { createContext } from 'react';
import { App, Plugin } from 'obsidian';
import { useContext, useState } from 'react';
import { VectorDatabase, Vector, SearchResponse } from 'vector';

export const AppContext = createContext<App | undefined>(undefined);

export const useApp = (): App | undefined => {
    return useContext(AppContext);
};

// Why is this necessary? Should the vector database be stored in the app context instead of the plugin context?
interface PluginApp extends App {
    plugins: {
        plugins: {
            [key: string]: EmbeddingPlugin;
        };
    };
}

interface EmbeddingPlugin extends Plugin {
    vectorDatabase: VectorDatabase;
    embedText: (input: string[]) => Promise<any>;
    runPCA: () => Promise<void>;
}

export const SearchBar = ({
    embeddingPlugin,
    setSearchResult,
}: {
    embeddingPlugin: EmbeddingPlugin;
    setSearchResult: React.Dispatch<
        React.SetStateAction<{
            searchResponse: SearchResponse[];
            query: Vector;
        }>
    >;
}) => {
    const [searchText, setSearchText] = useState<string>('');

    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSearchResult({
            searchResponse: [],
            query: {
                id: '',
                fullEmbedding: [],
                reducedEmbedding: [],
            },
        });

        const inputText = searchText.trim();
        if (inputText) {
            const embeddingResponse = await embeddingPlugin.embedText([
                inputText,
            ]);
            const fullEmbedding = embeddingResponse.data[0]
                .embedding as number[];
            const searchResponse =
                embeddingPlugin.vectorDatabase.search(fullEmbedding);

            embeddingPlugin.vectorDatabase.add({
                id: 'search',
                fullEmbedding,
                reducedEmbedding: fullEmbedding.slice(0, 2),
            });
            await embeddingPlugin.runPCA();

            const query = embeddingPlugin.vectorDatabase.get('search');
            if (query === undefined) {
                throw new Error(
                    'Something went wrong and search vector is not in database!',
                );
            }

            console.log(searchResponse);
            setSearchResult({
                searchResponse,
                query,
            });
        } else {
            console.log('Search text is empty');
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: 'gray',
                padding: '10px',
                borderRadius: '5px',
            }}
        >
            <form
                onSubmit={handleSearch}
                className="search"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ flex: 1, width: '100%', marginRight: '10px' }}
                />
                <button type="submit">Search</button>
            </form>
        </div>
    );
};

export const EmbeddingGraph = ({
    vectorDatabase,
    searchResult,
    setSearchResult,
}: {
    vectorDatabase: VectorDatabase;
    searchResult: {
        searchResponse: SearchResponse[];
        query: Vector;
    };
    setSearchResult: React.Dispatch<
        React.SetStateAction<{
            searchResponse: SearchResponse[];
            query: Vector;
        }>
    >;
}) => {
    const handleButtonClick = () => {
        vectorDatabase.delete('search');
        setSearchResult({
            searchResponse: [],
            query: {
                id: '',
                fullEmbedding: [],
                reducedEmbedding: [],
            },
        });
    };

    return (
        <div style={{ position: 'relative' }}>
            <Trash
                onClick={handleButtonClick}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1,
                }}
            >
                <i className="fa fa-trash"></i>
            </Trash>
            <svg width="100%" height="100%" viewBox="-1 -1 2 2">
                {searchResult.searchResponse.length > 0 ? (
                    <>
                        {searchResult.searchResponse.map((neighbor, i) => (
                            <g key={neighbor.id}>
                                <line
                                    key={i}
                                    x1={searchResult.query.reducedEmbedding[0]}
                                    y1={searchResult.query.reducedEmbedding[1]}
                                    x2={neighbor.reducedEmbedding[0]}
                                    y2={neighbor.reducedEmbedding[1]}
                                    strokeWidth=".001"
                                    stroke="black"
                                />
                                <circle
                                    id={neighbor.id}
                                    cx={neighbor.reducedEmbedding[0]}
                                    cy={neighbor.reducedEmbedding[1]}
                                    r=".03"
                                    fill="#919499"
                                    onMouseEnter={() => {
                                        const element = document.getElementById(
                                            neighbor.id,
                                        ) as HTMLElement;
                                        if (element) {
                                            element.style.fill = '#ae54d1';
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        const element = document.getElementById(
                                            neighbor.id,
                                        ) as HTMLElement;
                                        if (element) {
                                            element.style.fill = '#919499';
                                        }
                                    }}
                                />
                                <text
                                    x={neighbor.reducedEmbedding[0]}
                                    y={neighbor.reducedEmbedding[1] + 0.1}
                                    fontSize="0.05"
                                    textAnchor="middle"
                                    fill="#919499"
                                >
                                    {neighbor.id.replace('.md', '')}
                                </text>
                            </g>
                        ))}
                        <circle
                            id="search"
                            cx={searchResult.query.reducedEmbedding[0]}
                            cy={searchResult.query.reducedEmbedding[1]}
                            r=".03"
                            fill="red"
                            onMouseEnter={() => {
                                const element = document.getElementById(
                                    'search',
                                ) as HTMLElement;
                                if (element) {
                                    element.style.fill = '#ae54d1';
                                }
                            }}
                            onMouseLeave={() => {
                                const element = document.getElementById(
                                    'search',
                                ) as HTMLElement;
                                if (element) {
                                    element.style.fill = '#919499';
                                }
                            }}
                        />
                    </>
                ) : (
                    Array.from(vectorDatabase.vectors.values()).map(
                        (vector: Vector) => {
                            return (
                                <g key={vector.id}>
                                    <circle
                                        id={vector.id}
                                        cx={vector.reducedEmbedding[0]}
                                        cy={vector.reducedEmbedding[1]}
                                        r=".03"
                                        fill="#919499"
                                        onMouseEnter={() => {
                                            const element =
                                                document.getElementById(
                                                    vector.id,
                                                ) as HTMLElement;
                                            if (element) {
                                                element.style.fill = '#ae54d1';
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            const element =
                                                document.getElementById(
                                                    vector.id,
                                                ) as HTMLElement;
                                            if (element) {
                                                element.style.fill = '#919499';
                                            }
                                        }}
                                    />
                                    <text
                                        x={vector.reducedEmbedding[0]}
                                        y={vector.reducedEmbedding[1] + 0.1}
                                        fontSize="0.05"
                                        textAnchor="middle"
                                        fill="#919499"
                                    >
                                        {vector.id.replace('.md', '')}
                                    </text>
                                </g>
                            );
                        },
                    )
                )}
            </svg>
        </div>
    );
};
export const EmbeddingComponent = () => {
    const app = useApp() as PluginApp;

    const embeddingPlugin = app.plugins.plugins['Markdown Embedding Plugin'];
    const vectorDatabase = embeddingPlugin.vectorDatabase;

    const [searchResult, setSearchResult] = useState<{
        searchResponse: SearchResponse[];
        query: Vector;
    }>({
        searchResponse: [],
        query: {
            id: '',
            fullEmbedding: [],
            reducedEmbedding: [],
        },
    });

    return (
        <>
            <SearchBar
                embeddingPlugin={embeddingPlugin}
                setSearchResult={setSearchResult}
            />
            <EmbeddingGraph
                vectorDatabase={vectorDatabase}
                searchResult={searchResult}
                setSearchResult={setSearchResult}
            />
        </>
    );
};
