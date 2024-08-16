import { BrowserWindow, IpcMain } from "electron";
import * as path from "path";
import { LinkedPadProcess } from "./LinkedPadProcess";


const WINDOW_DIMENSION: { width: number, height: number } = { width: 1920, height: 1080 };
const CHANNEL_NAME: string = ':3';

export class Process {
    private readonly ipc: Electron.IpcMain;
    private window: BrowserWindow;
    private rendererReady: boolean = false;
    

    private linkedPad: LinkedPadProcess = new LinkedPadProcess(this.sendToRenderer.bind(this));


    constructor(ipcMain: IpcMain, args: string[]) {
        this.ipc = ipcMain;
    }

    public start(): void {
        this.createBrowserWindow();
        this.handleMainEvents()

        this.window.show();
    }




    private createBrowserWindow(): void {
        this.window = new BrowserWindow({
            show: false,
            height: WINDOW_DIMENSION.height,
            width: WINDOW_DIMENSION.width,
            webPreferences: {
                backgroundThrottling: false,
                preload: path.join(__dirname, "preload.js"),
            },
            autoHideMenuBar: true
        });

        this.window.loadFile(path.join(__dirname, "./view/index.html"));

        this.window.on('close', () => {
            this.stop();
        });

    }

    private handleMainEvents(): void {
        this.ipc.handle(CHANNEL_NAME, (_, eventType: string, ...data: any[]) => {
            
            this.linkedPad.handleEvent(eventType, ...data)
        });
        
    }

    private sendToRenderer(eventType: string, ...data: any[]): void {
        if (this.rendererReady) {
            this.window.webContents.send(CHANNEL_NAME, eventType, ...data);
            return;
        }

        this.window.webContents.on('did-finish-load', () => {
            this.rendererReady = true;
            this.window?.webContents.send(CHANNEL_NAME, eventType, ...data);
        });
    }

    private stop(): void {
        this.linkedPad.onExit();
    }




}