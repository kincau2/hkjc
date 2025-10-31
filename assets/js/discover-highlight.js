/**
 * Discover Highlight Page JavaScript
 * Handles filtering, sorting, and rendering of posts on the discover-highlight page
 * Works with both TC and EN language versions
 */

$(document).ready(function() {
    
    // Current filter and sort state
    let currentState = {
        categoryFilter: 'all',
        sortBy: 'newest'
    };

    // Initialize the page
    function init() {
        renderPosts();
        setupEventListeners();
    }

    // Render posts based on current filters and sort
    function renderPosts() {
        const $grid = $('#postsGrid');
        $grid.empty();

        // Get posts data from global variable (defined in HTML)
        if (typeof postsData === 'undefined') {
            console.error('postsData is not defined');
            return;
        }

        // Normalize category helper
        const normalizeCategory = (cat) => {
            const c = String(cat || '').toLowerCase();
            if (c === 'article' || c === 'articles') return 'articles';
            if (c === 'event' || c === 'events') return 'events';
            if (c === 'video' || c === 'videos') return 'videos';
            return c || 'others';
        };

        // Filter posts
        let filteredPosts = postsData
            .map(post => ({ ...post, category: normalizeCategory(post.category) }))
            .filter(post => {
                const matchesCategory = currentState.categoryFilter === 'all' || 
                                        post.category === currentState.categoryFilter;
                return matchesCategory;
            });

        // Sort posts
        filteredPosts = sortPosts(filteredPosts);

        // Build ordered video list matching display order
        const orderedVideoList = [];

        filteredPosts.forEach(post => {
            let videoIndexForCard;
            if (post.category === 'videos' && post.videoLink) {
                videoIndexForCard = orderedVideoList.length;
                orderedVideoList.push({
                    link: post.videoLink,
                    thumbnail: post.thumbnail,
                    title: post.title
                });
            }

            const postCard = createPostCard(post, videoIndexForCard);
            $grid.append(postCard);
        });

        // Update the global video popup list
        if (window.videoPop) {
            window.videoPop.videoList = orderedVideoList;
        }

        // Show message if no results
        if (filteredPosts.length === 0) {
            $grid.append('<div class="no-results">No posts match your filters. Try adjusting your selection.</div>');
        }
    }

    // Sort posts based on current sort option
    function sortPosts(posts) {
        const sorted = [...posts];
        
        switch(currentState.sortBy) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'most-view':
                sorted.sort((a, b) => b.views - a.views);
                break;
            case 'title-a-z':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        
        return sorted;
    }

    // Create post card HTML (matching index.html #discover section structure)
    function createPostCard(post, videoIndex) {
        const videoAttr = (videoIndex !== undefined) ? ` data-video-index="${videoIndex}"` : '';
        // Determine link for non-video posts
        const fallbackLink = `post-detail.html?id=${post.id}`;
        const targetLink = (post.category === 'videos' && post.videoLink)
            ? fallbackLink
            : (post.urlLink || post.articleLink || post.eventLink || fallbackLink);

        return $(`
            <div class="post swiper-slide" data-category="${post.category}"${videoAttr}>
                <a class="post-link" href="${targetLink}">
                    <div class="feature-img">
                        <img src="${post.thumbnail}" alt="${post.title}">
                    </div>
                    <div class="post-text-wrapper">
                        <p class="post-title">${post.title}</p>
                        <p class="post-excerpt">${post.excerpt}</p>
                    </div>
                </a>
            </div>
        `);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Sort/Filter button - toggle modal
        $('#sortFilterBtn').on('click', function(e) {
            e.stopPropagation();
            $('#sortFilterModal').toggleClass('active');
        });

        // Close modal when clicking outside
        $(document).on('click', function(e) {
            if ($('#sortFilterModal').hasClass('active')) {
                if (!$(e.target).closest('.sort-filter-content, #sortFilterBtn').length) {
                    $('#sortFilterModal').removeClass('active');
                }
            }
        });

        // Sort options
        $('.sort-option').on('click', function() {
            $('.sort-option').removeClass('active');
            $(this).addClass('active');
            
            currentState.sortBy = $(this).data('sort');
        });

        // Filter options
        $('.filter-option').on('click', function() {
            $('.filter-option').removeClass('active');
            $(this).addClass('active');
            
            currentState.categoryFilter = $(this).data('filter');
        });

        // Reset button
        $('#resetBtn').on('click', function() {
            // Reset state
            currentState = {
                categoryFilter: 'all',
                sortBy: 'newest'
            };
            
            // Reset UI
            $('.sort-option').removeClass('active');
            $('.sort-option[data-sort="newest"]').addClass('active');
            $('.filter-option').removeClass('active');
            $('.filter-option[data-filter="all"]').addClass('active');
            
            // Close modal and re-render
            $('#sortFilterModal').removeClass('active');
            renderPosts();
        });

        // Show Result button
        $('#showResultBtn').on('click', function() {
            $('#sortFilterModal').removeClass('active');
            renderPosts();
        });

        // Post card click - open video popup (only for video posts)
        $(document).on('click', '.post', function(e) {
            const videoIndex = $(this).data('video-index');
            if (videoIndex !== undefined && typeof openPopup === 'function') {
                e.preventDefault();
                openPopup(videoIndex);
            }
            // else: allow default navigation for Articles/Events
        });

        // Mobile navigation toggle icon handler
        const mobileNav = document.getElementById('mobileNav');
        const hamburgerIcon = document.querySelector('.hamburger-icon');
        const closeIcon = document.querySelector('.close-icon');
        
        if (mobileNav && hamburgerIcon && closeIcon) {
            mobileNav.addEventListener('show.bs.collapse', function() {
                hamburgerIcon.classList.add('d-none');
                closeIcon.classList.remove('d-none');
            });
            
            mobileNav.addEventListener('hide.bs.collapse', function() {
                hamburgerIcon.classList.remove('d-none');
                closeIcon.classList.add('d-none');
            });
        }
    }

    // Initialize on page load
    init();
});
