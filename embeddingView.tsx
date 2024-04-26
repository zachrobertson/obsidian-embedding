import React from 'react';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { EmbeddingComponent, AppContext } from 'embeddingComponent';

export const EMBEDDING_VIEW_TYPE = 'embedding-view';

export class EmbeddingView extends ItemView {
    private root: Root;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.render();
    }

    public getViewType(): string {
        return EMBEDDING_VIEW_TYPE;
    }

    public getDisplayText(): string {
        return 'Embedding view';
    }

    protected async onOpen(): Promise<void> {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <AppContext.Provider value={this.app}>
                <EmbeddingComponent />
            </AppContext.Provider>,
        );
    }

    protected async onClose(): Promise<void> {
        this.root?.unmount();
    }

    protected render() {
        return;
    }

    protected onSearch(id: string) {
        return;
    }
}
