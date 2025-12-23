import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'kr.perfectlancer.app',
	appName: '퍼펙트랜서',
	webDir: 'build',
	server: {
		url: 'http://192.168.1.3:5173/',
		cleartext: true,
	},
	plugins: {
		PushNotifications: {
			presentationOptions: ['badge', 'sound', 'alert'],
		},
	},
};

export default config;
