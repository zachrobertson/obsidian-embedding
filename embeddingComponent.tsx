import React from 'react';
import { App } from 'obsidian';
import { useContext } from 'react';
import { createContext } from 'react';

export const AppContext = createContext<App | undefined>(undefined);

export const useApp = (): App | undefined => {
    return useContext(AppContext);
}

export const EmbeddingComponent = () => {
    const { vault, workspace } = useApp() as App;
    console.log(vault);
    console.log(workspace);

    return <h4>Embedding Test!</h4>;
};