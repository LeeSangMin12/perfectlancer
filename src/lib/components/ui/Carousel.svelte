<script>
	import colors from '$lib/config/colors.js';

	import Icon from './Icon.svelte';

	let { images = [] } = $props();

	let current_index = $state(0);
	const MAX_DOTS = 5;
	let show_modal = $state(false);
	let modal_image = $state('');

	const go_to_slide = (i) => {
		current_index = i;
	};

	const prev = () => {
		current_index = (current_index - 1 + images.length) % images.length;
	};

	const next = () => {
		current_index = (current_index + 1) % images.length;
	};

	// 가운데 정렬을 위한 시작 인덱스 계산
	let start_index = $derived(
		Math.min(
			Math.max(0, current_index - Math.floor(MAX_DOTS / 2)),
			Math.max(0, images.length - MAX_DOTS)
		)
	);

	// 보여줄 dot 리스트
	let visible_dots = $derived(images.slice(start_index, start_index + MAX_DOTS));

	const open_modal = (img) => {
		modal_image = img;
		show_modal = true;
	};

	const close_modal = () => {
		show_modal = false;
		modal_image = '';
	};
</script>

<div class="relative w-full overflow-hidden rounded-lg">
	<!-- 이미지 슬라이드 -->
	<div
		class="flex transition-transform duration-500 ease-in-out"
		style="transform: translateX(-{current_index * 100}%);"
	>
		{#each images as img, index}
			<div class="flex min-w-full items-start justify-center">
				<button
					type="button"
					class="block w-full cursor-pointer overflow-hidden rounded-lg border-0 bg-transparent p-0"
					onclick={() => open_modal(img)}
					aria-label="이미지 크게 보기"
				>
					<img
						src={img}
						alt="게시물 이미지 {index + 1}"
						class="pointer-events-none h-auto max-h-80 w-full object-contain"
						draggable="false"
						loading={index === 0 ? 'eager' : 'lazy'}
						decoding="async"
					/>
				</button>
			</div>
		{/each}
	</div>

	<!-- 좌우 버튼 -->
	{#if images.length > 1}
		<button
			onclick={prev}
			class="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
		>
			<Icon attribute="arrow_left" size={20} color={colors.white} />
		</button>
		<button
			onclick={next}
			class="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
		>
			<Icon attribute="arrow_right" size={20} color={colors.white} />
		</button>
	{/if}

	<!-- dot 영역 -->
	<div
		class="absolute bottom-2 left-1/2 z-5 flex -translate-x-1/2 gap-2 rounded-full bg-black/50 px-2 py-1"
	>
		{#each visible_dots as _, i}
			<button
				class="h-1.5 w-1.5 rounded-full transition-all duration-300 ease-in-out"
				class:bg-white={current_index === start_index + i}
				class:bg-gray-400={current_index !== start_index + i}
				class:scale-125={current_index === start_index + i}
				aria-label={`Go to slide ${start_index + i + 1}`}
				onclick={() => go_to_slide(start_index + i)}
			></button>
		{/each}
	</div>
</div>

{#if show_modal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
		onclick={close_modal}
		role="presentation"
	>
		<div
			class="relative"
			role="dialog"
			tabindex="0"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Escape') close_modal();
			}}
		>
			<img
				src={modal_image}
				alt="이미지 확대보기"
				class="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg"
				loading="eager"
				decoding="async"
			/>
			<button
				class="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
				onclick={close_modal}
				aria-label="닫기"
			>
				<Icon attribute="close" size={20} color={colors.white} />
			</button>
		</div>
	</div>
{/if}

<!-- 이미지가 1개일때 -->
<!-- <img
			src="https://gscaltexmediahub.com/wp-content/uploads/2023/05/20230523_01_03.jpg"
			alt="Shoes"
			class="aspect-auto max-h-80 w-full rounded-lg object-cover"
		/> -->
