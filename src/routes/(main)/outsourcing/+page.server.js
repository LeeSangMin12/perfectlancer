import { create_api } from '$lib/supabase/api';

/**
 * 외주 페이지 서버 로드 함수
 * @param {Object} params - 로드 파라미터
 * @param {Object} params.locals - SvelteKit locals
 * @param {Object} params.locals.supabase - Supabase 클라이언트
 * @returns {Promise<Object>} 외주 공고 데이터
 */
export async function load({ locals: { supabase } }) {
	const api = create_api(supabase);

	// 두 job_type의 데이터를 병렬로 로드 (SSR 최적화)
	const [sidejob_result, fulltime_result] = await Promise.all([
		api.work_requests.select_infinite_scroll('', '', 10, 'sidejob'),
		api.work_requests.select_infinite_scroll('', '', 10, 'fulltime'),
	]);

	return {
		sidejob_requests: sidejob_result.data,
		fulltime_requests: fulltime_result.data,
	};
}
