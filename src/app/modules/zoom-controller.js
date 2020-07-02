import { BrowserWindow as ElectronBrowserWindow } from 'electron';
import bindAll from 'lodash/bindAll';
import {
  DEFAULT_ZOOM_FACTOR,
  ipcRendererListeners,
  storageKeys,
  ZOOM_INCREMENT,
  ZOOM_MAX,
  ZOOM_MIN
} from '../constants';

// This should only be used in the main process
export default class ZoomController {

  constructor(storage) {
    this._storage = storage;
    bindAll(this, [
      'zoomIn',
      'zoomOut',
      'zoomReset'
    ]);
  }

  zoomIn() {
    const storage = this._storage;
    const zoomFactor = storage.getItem(storageKeys.ZOOM_FACTOR);
    if(zoomFactor < ZOOM_MAX) {
      const windows = ElectronBrowserWindow.getAllWindows();
      const newZoomFactor = zoomFactor + ZOOM_INCREMENT;
      windows.forEach(w => {
        w.send(ipcRendererListeners.ZOOM_IN, newZoomFactor);
      });
      storage.setItem(storageKeys.ZOOM_FACTOR, newZoomFactor);
    }
  }

  zoomOut() {
    const storage = this._storage;
    const zoomFactor = storage.getItem(storageKeys.ZOOM_FACTOR);
    if(zoomFactor > ZOOM_MIN) {
      const windows = ElectronBrowserWindow.getAllWindows();
      const newZoomFactor = zoomFactor - ZOOM_INCREMENT;
      windows.forEach(w => {
        w.send(ipcRendererListeners.ZOOM_OUT, newZoomFactor);
      });
      storage.setItem(storageKeys.ZOOM_FACTOR, newZoomFactor);
    }
  }

  zoomReset() {
    const storage = this._storage;
    const windows = ElectronBrowserWindow.getAllWindows();
    windows.forEach(w => {
      w.send(ipcRendererListeners.ZOOM_RESET);
    });
    storage.setItem(storageKeys.ZOOM_FACTOR, DEFAULT_ZOOM_FACTOR);
  }

}
