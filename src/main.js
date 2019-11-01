import LeafletLayerManager from './LeafletLayerManager'

if (typeof window !== 'undefined') {
    window['LeafletLayerManager'] = LeafletLayerManager;
}