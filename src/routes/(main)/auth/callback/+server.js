import { redirect } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';

export const GET = async (event) => {
	const {
		url,
		locals: { supabase },
	} = event;
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	// URL에서 에러 파라미터 확인 (Supabase에서 리다이렉트 시 포함될 수 있음)
	const error_code = url.searchParams.get('error');
	const error_description = url.searchParams.get('error_description');

	// OAuth 에러 처리 (이미 다른 provider로 가입된 이메일 등)
	if (error_code) {
		console.error('OAuth error:', error_code, error_description);

		// 이메일 중복 관련 에러 처리
		if (
			error_description?.includes('already registered') ||
			error_description?.includes('identity already exists') ||
			error_description?.includes('email address')
		) {
			redirect(303, '/login?error=duplicate_email&provider=unknown');
		}

		redirect(303, '/auth/auth-code-error');
	}

	const api = create_api(supabase);

	if (code) {
		const { data: session_data, error } =
			await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('Exchange code error:', error);

			// 이메일 중복 에러 처리
			if (
				error.message?.includes('already registered') ||
				error.message?.includes('identity already exists') ||
				error.message?.includes('Email link is invalid')
			) {
				// 사용자에게 기존 가입 방식으로 로그인하라고 안내
				redirect(303, '/login?error=duplicate_email&provider=unknown');
			}

			redirect(303, '/auth/auth-code-error');
		}

		if (session_data.session) {
			const user_id = session_data.session.user.id;
			const user_email = session_data.session.user.email;

			// 사용자 정보 조회
			const user = await api.users.select(user_id);

			// 신규 사용자: 회원가입 페이지로 이동
			if (!user || user.handle === null) {
				// 이메일 중복 체크 (다른 auth 계정으로 이미 가입된 경우)
				if (user_email) {
					const { exists, provider } =
						await api.auth.check_email_provider(user_email);

					// users 테이블에 같은 이메일로 다른 사용자가 있는 경우
					if (exists && provider) {
						// 현재 세션 삭제 (충돌 방지)
						await supabase.auth.signOut();
						redirect(
							303,
							`/login?error=duplicate_email&provider=${provider}`,
						);
					}
				}

				redirect(303, '/sign-up');
			}

			// 기존 사용자: 원래 목적지로 이동
			redirect(303, `/${next.slice(1)}`);
		}
	}

	redirect(303, '/auth/auth-code-error');
};
