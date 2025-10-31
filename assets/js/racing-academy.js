/**
 * Racing Academy Page JavaScript
 * Handles filtering, sorting, and rendering of educational posts on the racing-academy page
 * Works with both TC and EN language versions
 */

$(document).ready(function() {
    
    // Current filter and sort state
    let currentState = {
        tagFilter: 'all',
        levelFilter: 'all',
        sortBy: 'level-low-high'
    };

    // Level order mapping
    const levelOrder = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3,
        'expert': 4,
        'master': 5
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

        // Filter posts
        let filteredPosts = postsData.filter(post => {
            // Tag filter
            const matchesTag = currentState.tagFilter === 'all' || 
                            post.tags.includes(currentState.tagFilter);
            
            // Level filter
            const matchesLevel = currentState.levelFilter === 'all' || 
                                post.level === currentState.levelFilter;
            
            return matchesTag && matchesLevel;
        });

        // Sort posts
        filteredPosts = sortPosts(filteredPosts);

        // Group posts by level
        const groupedPosts = groupPostsByLevel(filteredPosts);

        // Build ordered video list matching display order (top to bottom, left to right)
        const orderedVideoList = [];
        let displayIndex = 0;

        // Render grouped posts
        const levelNames = {
            'beginner': 'Beginner',
            'intermediate': 'Intermediate',
            'advanced': 'Advanced',
            'expert': 'Expert',
            'master': 'Master'
        };

        const levelOrderArray = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];

        levelOrderArray.forEach(level => {
            if (groupedPosts[level] && groupedPosts[level].length > 0) {
                const $levelGroup = $('<div class="level-group"></div>');
                const $levelTitle = $(`<h2 class="level-group-title">${levelNames[level]}</h2>`);
                const $levelPosts = $('<div class="level-group-posts"></div>');

                groupedPosts[level].forEach(post => {
                    // Add to video list in display order
                    orderedVideoList.push({
                        link: post.videoLink,
                        thumbnail: post.thumbnail,
                        title: post.title
                    });

                    // Create post card with sequential display index
                    const postCard = createPostCard(post, displayIndex);
                    $levelPosts.append(postCard);
                    
                    displayIndex++;
                });

                $levelGroup.append($levelTitle);
                $levelGroup.append($levelPosts);
                $grid.append($levelGroup);
            }
        });

        console.log('Ordered Video List:', orderedVideoList);

        // Update the global video popup list
        if (window.videoPop) {
            window.videoPop.videoList = orderedVideoList;
        }

        // Show message if no results
        if (filteredPosts.length === 0) {
            $grid.append('<div class="no-results">No posts match your filters. Try adjusting your selection.</div>');
        }
    }

    // Group posts by level
    function groupPostsByLevel(posts) {
        const grouped = {
            'beginner': [],
            'intermediate': [],
            'advanced': [],
            'expert': [],
            'master': []
        };

        posts.forEach(post => {
            if (grouped[post.level]) {
                grouped[post.level].push(post);
            }
        });

        return grouped;
    }

    // Sort posts based on current sort option
    function sortPosts(posts) {
        const sorted = [...posts];
        
        switch(currentState.sortBy) {
            case 'level-low-high':
                sorted.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
                break;
            case 'level-high-low':
                sorted.sort((a, b) => levelOrder[b.level] - levelOrder[a.level]);
                break;
            case 'newest':
                sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'most-view':
                sorted.sort((a, b) => b.views - a.views);
                break;
        }
        
        return sorted;
    }

    // Create post card HTML
    function createPostCard(post, displayIndex) {
        const categoryTag = post.tags[0].split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        const categoryTagClass = categoryTag.toLowerCase().replace(/\s+/g, '-');
        return $(`
            <div class="post-card" data-level="${post.level}" data-tags="${post.tags.join(',')}" data-video-index="${displayIndex}">
                <div class="post-thumbnail">
                    <img src="${post.thumbnail}" alt="${post.title}">
                    <div class="post-play-icon">
                        <img src="../assets/images/video-play-icon.png" class="play-icon" alt="Play Icon">
                    </div>
                </div>
                <div class="post-content">
                    <div class="post-tags">
                        <span class="post-tag level level-${post.level}">${capitalizeFirst(post.level)}</span>
                        <span class="post-tag ${categoryTagClass}">${categoryTag}</span>
                    </div>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-excerpt">${post.excerpt}</p>
                </div>
            </div>
        `);
    }

    // Helper function to capitalize first letter
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Tag filter buttons
        $('.tag-filter-btn').on('click', function() {
            const tag = $(this).data('tag');
            
            // Update active state
            $('.tag-filter-btn').removeClass('active');
            $(this).addClass('active');
            
            // Update state
            currentState.tagFilter = tag;
            
            // Update modal filter to match
            syncModalWithTagFilter(tag);
            
            // Re-render posts
            renderPosts();
        });

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
            
            currentState.levelFilter = $(this).data('filter');
            
            // If specific level is selected, update tag filter to 'all'
            if (currentState.levelFilter !== 'all') {
                currentState.tagFilter = 'all';
                $('.tag-filter-btn').removeClass('active');
                $('.tag-filter-btn[data-tag="all"]').addClass('active');
            }
        });

        // Reset button
        $('#resetBtn').on('click', function() {
            // Reset state
            currentState = {
                tagFilter: 'all',
                levelFilter: 'all',
                sortBy: 'level-low-high'
            };
            
            // Reset UI
            $('.tag-filter-btn').removeClass('active');
            $('.tag-filter-btn[data-tag="all"]').addClass('active');
            $('.sort-option').removeClass('active');
            $('.sort-option[data-sort="level-low-high"]').addClass('active');
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

        // Post card click - open video popup
        $(document).on('click', '.post-card', function() {
            const videoIndex = $(this).data('video-index');
            if (typeof openPopup === 'function') {
                openPopup(videoIndex);
            }
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

    // Sync modal filter with tag filter
    function syncModalWithTagFilter(tag) {
        // If a specific tag is selected (not 'all'), set level filter to 'all'
        if (tag !== 'all') {
            currentState.levelFilter = 'all';
            $('.filter-option').removeClass('active');
            $('.filter-option[data-filter="all"]').addClass('active');
        }
    }

    // Initialize on page load
    init();
});
