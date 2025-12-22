import { create_post_reports_api } from '$lib/supabase/post/post_reports';
import { create_post_comment_reports_api } from '$lib/supabase/post/post_comment_reports';
import { create_user_reports_api } from '$lib/supabase/user/user_reports';
import { create_service_reports_api } from '$lib/supabase/service/service_reports';
import { create_community_reports_api } from '$lib/supabase/community/community_reports';

/**
 * 관리자용 신고 관리 API
 */
export const create_admin_reports_api = (supabase) => {
	const post_reports = create_post_reports_api(supabase);
	const post_comment_reports = create_post_comment_reports_api(supabase);
	const user_reports = create_user_reports_api(supabase);
	const service_reports = create_service_reports_api(supabase);
	const community_reports = create_community_reports_api(supabase);

	return {
		/**
		 * 게시물 신고 목록 조회
		 */
		async select_post_reports({ resolved = null, limit = 100 } = {}) {
			return await post_reports.get_reports({ resolved, limit });
		},

		/**
		 * 커뮤니티 신고 목록 조회
		 */
		async select_community_reports({ resolved = null, limit = 100 } = {}) {
			return await community_reports.get_reports({ resolved, limit });
		},

		/**
		 * 사용자 신고 목록 조회
		 */
		async select_user_reports({ resolved = null, limit = 100 } = {}) {
			return await user_reports.get_reports({ resolved, limit });
		},

		/**
		 * 댓글 신고 목록 조회
		 */
		async select_comment_reports({ resolved = null, limit = 100 } = {}) {
			return await post_comment_reports.get_reports({ resolved, limit });
		},

		/**
		 * 서비스 신고 목록 조회
		 */
		async select_service_reports({ resolved = null, limit = 100 } = {}) {
			return await service_reports.get_reports({ resolved, limit });
		},

		/**
		 * 신고 처리 (모든 타입)
		 */
		async resolve_post_report(id, resolved_by) {
			return await post_reports.resolve(id, resolved_by);
		},

		async resolve_comment_report(id, resolved_by) {
			return await post_comment_reports.resolve(id, resolved_by);
		},

		async resolve_user_report(id, resolved_by) {
			return await user_reports.resolve(id, resolved_by);
		},

		async resolve_service_report(id, resolved_by) {
			return await service_reports.resolve(id, resolved_by);
		},

		async resolve_community_report(id, resolved_by) {
			return await community_reports.resolve(id, resolved_by);
		},

		/**
		 * 신고 통계 조회 (통합)
		 */
		async get_stats() {
			const [post_stats, comment_stats, user_stats, service_stats, community_stats] =
				await Promise.all([
					supabase.from('post_reports').select('resolved_at'),
					supabase.from('post_comment_reports').select('resolved_at'),
					supabase.from('user_reports').select('resolved_at'),
					supabase.from('service_reports').select('resolved_at'),
					supabase.from('community_reports').select('resolved_at')
				]);

			const stats = {
				total: 0,
				pending: 0,
				resolved: 0,
				by_type: {
					post: { total: 0, pending: 0, resolved: 0 },
					comment: { total: 0, pending: 0, resolved: 0 },
					user: { total: 0, pending: 0, resolved: 0 },
					service: { total: 0, pending: 0, resolved: 0 },
					community: { total: 0, pending: 0, resolved: 0 }
				}
			};

			const calculateStats = (data, type) => {
				if (!data || !data.data) return;
				const typeStats = { total: data.data.length, pending: 0, resolved: 0 };

				data.data.forEach((report) => {
					if (report.resolved_at) {
						typeStats.resolved++;
					} else {
						typeStats.pending++;
					}
				});

				stats.by_type[type] = typeStats;
				stats.total += typeStats.total;
				stats.pending += typeStats.pending;
				stats.resolved += typeStats.resolved;
			};

			calculateStats(post_stats, 'post');
			calculateStats(comment_stats, 'comment');
			calculateStats(user_stats, 'user');
			calculateStats(service_stats, 'service');
			calculateStats(community_stats, 'community');

			return stats;
		}
	};
};
