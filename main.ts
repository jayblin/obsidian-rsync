import { exec } from 'child_process';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, SettingTab } from 'obsidian';

interface RsyncPluginSettings {
	backupAddress: string;
	username: string;
	wslVaultPath: string;
}

const DEFAULT_SETTINGS: RsyncPluginSettings = {
	backupAddress: '',
	username: '',
	wslVaultPath: '',
}

export default class RsyncPlugin extends Plugin {
	settings: RsyncPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		const settingTab = new RsyncSettingTab(this.app, this);
		this.addSettingTab(settingTab);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			'folder-sync',
			'Sync vault',
			async (evt: MouseEvent) => {
				// Called when the user clicks the icon.
				// new Notice('This is a notice!');
				const addr = this.settings.backupAddress;

				// 192.168.0.201
				if (!(/^(\d{1,3}\.){3}\d{1,3}$/.test(addr))) {
					new Notice('Go to settings and set a valid backup IP-address.');
					return;
				}

				if (!this.settings.wslVaultPath) {
					new Notice('Go to settings and set a wsl-accessible path to vault.');
					return;
				}

				if (!this.settings.username) {
					new Notice('Go to settings and set a username for backup server authentication.');
					return;
				}

				try {

						console.log(`wsl rsync -av ${this.settings.wslVaultPath} ${this.settings.username}@${addr}:~/Obsidian/`);
					return;
					const proc = exec(
						`wsl rsync -av ${this.settings.wslVaultPath} ${this.settings.username}@${addr}:~/Obsidian/`,
						// `wsl pwd`,
						(error, stdout, stderr) => {
							if (error) {
								console.log(`error: ${error.message}`);
								return;
							}
							if (stderr) {
								console.log(`stderr: ${stderr}`);
								return;
							}
							console.log(`stdout: ${stdout}`);
						}
					);
				}
				catch (e) {
					console.error(e);
				}
			}
		);

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('rsync-plugin-ribbon-class');

		return;

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class RsyncSettingTab extends PluginSettingTab {
	plugin: RsyncPlugin;

	constructor(app: App, plugin: RsyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for rsync plugin.'});

		new Setting(containerEl)
			.setName('Backup address')
			.setDesc('')
			.addText(text => text
				// .setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.backupAddress)
				.onChange(async (value) => {
					this.plugin.settings.backupAddress = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('WSL-accessible path to this vault')
			.setDesc('')
			.addText(text => text
				.setValue(this.plugin.settings.wslVaultPath)
				.onChange(async (value) => {
					this.plugin.settings.wslVaultPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Username for backup server authentication')
			.setDesc('')
			.addText(text => text
				.setValue(this.plugin.settings.username)
				.onChange(async (value) => {
					this.plugin.settings.username = value;
					await this.plugin.saveSettings();
				}));
	}
}
