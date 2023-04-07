// only export functions here that should be used in vs code as commands
// these functions have to also be added to the package.json under the "commands" section

import * as vscode from 'vscode';
import * as api from './api';

export const generate = async () => {
    const prompt = await vscode.window.showInputBox({
        prompt: "Instructions for code to generate",
    });
    if (!prompt) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const document = editor.document;
    const selection = document.getText(editor.selection);
    const fileUri = document.uri;
    const filePath = fileUri.fsPath;
    const projectPath = vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath ?? null;
    let carret = editor.selection.end;

    try {
        for await (let chunk of api.generate(prompt, filePath, document.getText(), projectPath, selection)) {
            const success = await editor.edit(builder => builder.insert(carret, chunk));
            if (!success) {
                break;
            }
            carret = carret.translate(carret.line, carret.character + chunk.length);
        }
    } catch (error) {
        const err = (error as Error).message ?? error;
        vscode.window.showErrorMessage(err);
    }
};