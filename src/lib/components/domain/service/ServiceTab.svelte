<script>
	/**
	 * Service tab component
	 * @component
	 * Renders service grid with infinite scroll functionality
	 */
	import FloatingActionButton from '$lib/components/shared/FloatingActionButton.svelte';
	import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
	import Service from '$lib/components/domain/service/Service.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {Object} serviceData - Service data manager
	 * @property {Object} infiniteScroll - Infinite scroll controller
	 */
	let { serviceData, infiniteScroll } = $props();

	/**
	 * Handles like status change from Service component
	 * @param {Object} event - Like change event
	 * @param {string} event.service_id - Service ID
	 * @param {Array} event.likes - Updated likes array
	 */
	const handleLikeChanged = ({ service_id, likes }) => {
		serviceData.serviceLikes = likes;
	};

	$effect(() => {
		infiniteScroll.initializeLastId();
		const observer = infiniteScroll.setupObserver();

		return () => {
			observer?.disconnect();
		};
	});
</script>

<section>
	<div class="mt-4 grid grid-cols-2 gap-4 px-4 sm:grid-cols-3">
		{#each serviceData.services as service}
			<Service {service} service_likes={serviceData.serviceLikes} on_like_changed={handleLikeChanged} />
		{/each}
	</div>

	<div id="infinite_scroll"></div>

	<LoadingSpinner is_loading={serviceData.isInfiniteLoading} />
</section>

<FloatingActionButton href="/regi/service" />
