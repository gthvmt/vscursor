import * as vscode from 'vscode';
import * as commands from './commands';


export function activate(context: vscode.ExtensionContext) {
	for (const key in commands) {
		if (commands.hasOwnProperty(key)) {
			context.subscriptions.push(vscode.commands.registerCommand(`vscursor.${key}`, (commands as any)[key]));
		}
	}
}

export function deactivate() { }