// === Bucket APIs ===
import { create_community_avatars_api } from '$lib/supabase/bucket/communities/avatars';
import { create_post_images_api } from '$lib/supabase/bucket/posts/images';
import { create_service_images_api } from '$lib/supabase/bucket/services/images';
import { create_user_avatars_api } from '$lib/supabase/bucket/users/avatars';
import { create_proposal_attachments_bucket_api } from '$lib/supabase/bucket/proposals/attachments';
import { create_work_request_images_api } from '$lib/supabase/bucket/work_requests/images';

// === Auth ===
import { create_auth_api } from '$lib/supabase/auth';

// === Post APIs ===
import { create_posts_api } from '$lib/supabase/post/posts';
import { create_post_votes_api } from '$lib/supabase/post/post_votes';
import { create_post_comments_api } from '$lib/supabase/post/post_comments';
import { create_post_bookmarks_api } from '$lib/supabase/post/post_bookmarks';
import { create_post_reports_api } from '$lib/supabase/post/post_reports';
import { create_post_comment_votes_api } from '$lib/supabase/post/post_comment_votes';

// === User APIs ===
import { create_users_api } from '$lib/supabase/user/users';
import { create_user_follows_api } from '$lib/supabase/user/user_follows';
import { create_user_contacts_api } from '$lib/supabase/user/user_contacts';
import { create_user_devices_api } from '$lib/supabase/user/user_devices';
import { create_user_coupons_api } from '$lib/supabase/user/user_coupons';
import { create_user_bank_accounts_api } from '$lib/supabase/user/user_bank_accounts';
import { create_user_reports_api } from '$lib/supabase/user/user_reports';
import { create_inquiries_api } from '$lib/supabase/user/inquiries';

// === Service APIs ===
import { create_services_api } from '$lib/supabase/service/services';
import { create_service_orders_api } from '$lib/supabase/service/service_orders';
import { create_service_options_api } from '$lib/supabase/service/service_options';
import { create_service_reviews_api } from '$lib/supabase/service/service_reviews';
import { create_service_likes_api } from '$lib/supabase/service/service_likes';
import { create_order_options_api } from '$lib/supabase/service/order_options';
import { create_quote_templates_api } from '$lib/supabase/service/quote_templates';

// === Outsourcing APIs ===
import { create_work_requests_api } from '$lib/supabase/outsourcing/work_requests';
import { create_work_request_proposals_api } from '$lib/supabase/outsourcing/work_request_proposals';
import { create_work_request_reviews_api } from '$lib/supabase/outsourcing/work_request_reviews';

// === Community APIs ===
import { create_communities_api } from '$lib/supabase/community/communities';
import { create_community_members_api } from '$lib/supabase/community/community_members';
import { create_community_topics_api } from '$lib/supabase/community/community_topics';
import { create_community_reports_api } from '$lib/supabase/community/community_reports';
import { create_topics_api } from '$lib/supabase/community/topics';

// === Payment APIs ===
import { create_payments_api } from '$lib/supabase/payment/payments';
import { create_point_charges_api } from '$lib/supabase/payment/point_charges';
import { create_point_withdrawals_api } from '$lib/supabase/payment/point_withdrawals';
import { create_point_transactions_api } from '$lib/supabase/payment/point_transactions';
import { create_seller_settlements_api } from '$lib/supabase/payment/seller_settlements';
import { create_coupons_api } from '$lib/supabase/payment/coupons';

// === Notification APIs ===
import { create_notifications_api } from '$lib/supabase/notification/notifications';
import { create_notification_settings_api } from '$lib/supabase/notification/notification_settings';

export const create_api = (supabase) => ({
	// Auth
	auth: create_auth_api(supabase),

	// Post
	posts: create_posts_api(supabase),
	post_votes: create_post_votes_api(supabase),
	post_comments: create_post_comments_api(supabase),
	post_bookmarks: create_post_bookmarks_api(supabase),
	post_reports: create_post_reports_api(supabase),
	post_comment_votes: create_post_comment_votes_api(supabase),

	// User
	users: create_users_api(supabase),
	user_follows: create_user_follows_api(supabase),
	user_contacts: create_user_contacts_api(supabase),
	user_devices: create_user_devices_api(supabase),
	user_coupons: create_user_coupons_api(supabase),
	user_bank_accounts: create_user_bank_accounts_api(supabase),
	user_reports: create_user_reports_api(supabase),
	inquiries: create_inquiries_api(supabase),

	// Service
	services: create_services_api(supabase),
	service_orders: create_service_orders_api(supabase),
	service_options: create_service_options_api(supabase),
	service_reviews: create_service_reviews_api(supabase),
	service_likes: create_service_likes_api(supabase),
	order_options: create_order_options_api(supabase),
	quote_templates: create_quote_templates_api(supabase),

	// Outsourcing
	work_requests: create_work_requests_api(supabase),
	work_request_proposals: create_work_request_proposals_api(supabase),
	work_request_reviews: create_work_request_reviews_api(supabase),

	// Community
	communities: create_communities_api(supabase),
	community_members: create_community_members_api(supabase),
	community_topics: create_community_topics_api(supabase),
	community_reports: create_community_reports_api(supabase),
	topics: create_topics_api(supabase),

	// Payment
	payments: create_payments_api(supabase),
	point_charges: create_point_charges_api(supabase),
	point_withdrawals: create_point_withdrawals_api(supabase),
	point_transactions: create_point_transactions_api(supabase),
	seller_settlements: create_seller_settlements_api(supabase),
	coupons: create_coupons_api(supabase),

	// Notification
	notifications: create_notifications_api(supabase),
	notification_settings: create_notification_settings_api(supabase),

	// Bucket (Storage)
	community_avatars: create_community_avatars_api(supabase),
	user_avatars: create_user_avatars_api(supabase),
	post_images: create_post_images_api(supabase),
	service_images: create_service_images_api(supabase),
	proposal_attachments_bucket: create_proposal_attachments_bucket_api(supabase),
	work_request_images: create_work_request_images_api(supabase),
});
