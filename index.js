const DiscordRPC = require('discord-rpc');
const axios = require('axios');
const defaultClientId = '757707416719851651';
const config = require('./config.json');
const clientId = config.clientId;

DiscordRPC.register(clientId);
const client = new DiscordRPC.Client({ transport: 'ipc' });

axios.defaults.baseURL = 'https://api.pluralkit.me/v1';

var system;

async function setFront() {
	try {
		if (!system) {
			var data = (await axios(`/a/${client.user.id}`)).data;
			system = data;
		}

		var front = (await axios(`/s/${system.id}/fronters`)).data;

		if (config.use_name_by_default) {
			members = front.members.map(m => m.name).join(", ");
			if (members.length > 127) {
				members = members.slice(0, 120) + "...";
			}
		} else {
			members = front.members.map(m => m.display_name || m.name).join(", ");
		}
		if (members.length > 127) {
			members = front.members.map(m => m.name).join(", ");
		}

		if (clientId == defaultClientId) {
			activity = {
				details: members || "(none)",
				state: system.name || "---",
				startTimestamp: new Date(front.timestamp)
			};
		} else {
			// don't show IDs if config option is set
			if (config.hide_id) {
				lText = front.members[0]?.name;
				sText = system.name;
			} else {
				lText = "pk;m " + front.members[0]?.id;
				sText = "pk;s " + system.id;
			}
			activity = {
				details: members || "(none)",
				state: system.name || "---",
				startTimestamp: new Date(front.timestamp),
				largeImageKey: front.members[0]?.id || "none",
				largeImageText: lText || "none",
				smallImageKey: system.id,
				smallImageText: sText || "system",
				instance: false
			};
		}

		client.setActivity(activity)
	} catch (e) {
		if (e.response) {
			if (e.response.data == "Account not found.") {
				console.error("Account doesn't have a system registered.");
			} else if (e.response.response == "Unauthorized to view fronter.") {
				console.error("Account's front is set to private.");
			} else if (e.response.response == "System has no registered switches.") {
				console.error("Account has no registered switches.");
			} else console.error(e.response.data);
		} else console.error(e.message);
		process.exit(1);
	}
}

client.on('ready', () => {
	setFront();

	setInterval(() => setFront(), 15000);
})

client.login({ clientId }).catch(console.error).then(() => console.log("RPC running!"));
