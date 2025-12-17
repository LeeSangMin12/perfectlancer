export const create_work_request_images_api = (supabase) => ({
	upload: async (file_path, image_file) => {
		const { error } = await supabase.storage
			.from('work_requests')
			.upload(`images/${file_path}`, image_file, {
				cacheControl: '3600',
				upsert: false,
			});

		if (error) {
			throw new Error(`이미지 업로드 실패: ${error.message}`);
		}
	},
});
