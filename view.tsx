import React from 'react';
import VectorDatabase from 'vector';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { EmbeddingComponent, AppContext } from 'embeddingComponent';


export const EMBEDDING_VIEW_TYPE = 'embedding-view'

export class EmbeddingView extends ItemView {
    private vectorDatabase: VectorDatabase;
    private root: Root;

    constructor(leaf: WorkspaceLeaf, vectorDatabase: VectorDatabase) {
        super(leaf)
        this.render()
        this.vectorDatabase = vectorDatabase;
    }

    public getViewType(): string {
        return EMBEDDING_VIEW_TYPE;
    }

    public getDisplayText(): string {
        return 'Embedding view';
    }

    protected async onOpen(): Promise<void> {
        // TODO generate graph of datapoints in vector database
        this.root = createRoot(this.containerEl.children[1])
        this.root.render(
            <AppContext.Provider value={this.app}>
                <EmbeddingComponent />
            </AppContext.Provider>
        )
    }

    protected async onClose(): Promise<void> {
        this.root?.unmount();
    }

    protected render() {
        return
    }

    protected onSearch(id: string) {
        return
    }
}