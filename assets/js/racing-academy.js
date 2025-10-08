// Racing Academy Listing Page JavaScript

$(document).ready(function() {
    
    // Demo posts data - will be used to populate the grid
    const postsData = [
        {
            id: 1,
            title: "3 minutes Guide to Horse Racing!",
            excerpt: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
            thumbnail: "assets/images/edu_area_video1.jpg",
            level: "beginner",
            tags: ["racing-kickstarter"],
            videoIndex: 0,
            views: 1200,
            date: "2024-01-15"
        },
        {
            id: 2,
            title: "Understanding 2 Major Types of Bets",
            excerpt: "Learn about WIN and PLACE bets - the foundation of horse racing betting.",
            thumbnail: "assets/images/edu_area_video2.jpg",
            level: "beginner",
            tags: ["bet-type"],
            videoIndex: 1,
            views: 980,
            date: "2024-01-20"
        },
        {
            id: 3,
            title: "4 Basic Bet Types You MUST Know",
            excerpt: "Master the essential betting types for successful horse racing wagering.",
            thumbnail: "assets/images/edu_area_video3.jpg",
            level: "beginner",
            tags: ["betting-strategy"],
            videoIndex: 2,
            views: 1450,
            date: "2024-01-25"
        },
        {
            id: 4,
            title: "Understanding Jockey and Trainer Roles",
            excerpt: "Discover how jockeys and trainers impact race outcomes and betting strategy.",
            thumbnail: "assets/images/edu_area_video4.jpg",
            level: "intermediate",
            tags: ["horse-jockey-trainer"],
            videoIndex: 3,
            views: 850,
            date: "2024-02-01"
        },
        {
            id: 5,
            title: "Reading Race Cards Like a Pro",
            excerpt: "Learn to interpret race cards and make informed betting decisions.",
            thumbnail: "assets/images/edu_area_video5.jpg",
            level: "intermediate",
            tags: ["basics-to-racing"],
            videoIndex: 4,
            views: 1100,
            date: "2024-02-05"
        },
        {
            id: 6,
            title: "Advanced Quinella Betting Strategies",
            excerpt: "Master the art of quinella betting with proven strategies.",
            thumbnail: "assets/images/edu_area_video1.jpg",
            level: "advanced",
            tags: ["bet-type", "betting-strategy"],
            videoIndex: 0,
            views: 720,
            date: "2024-02-10"
        },
        {
            id: 7,
            title: "Form Analysis Fundamentals",
            excerpt: "Understand how to analyze horse form for better predictions.",
            thumbnail: "assets/images/edu_area_video2.jpg",
            level: "intermediate",
            tags: ["basics-to-racing"],
            videoIndex: 1,
            views: 890,
            date: "2024-02-15"
        },
        {
            id: 8,
            title: "Simulcast Racing: Global Opportunities",
            excerpt: "Explore international racing markets and simulcast betting options.",
            thumbnail: "assets/images/edu_area_video3.jpg",
            level: "advanced",
            tags: ["simulcast-racing"],
            videoIndex: 2,
            views: 650,
            date: "2024-02-20"
        },
        {
            id: 9,
            title: "Expert Handicapping Techniques",
            excerpt: "Advanced methods for evaluating horses and predicting race outcomes.",
            thumbnail: "assets/images/edu_area_video4.jpg",
            level: "expert",
            tags: ["betting-strategy"],
            videoIndex: 3,
            views: 540,
            date: "2024-02-25"
        },
        {
            id: 10,
            title: "Track Conditions and Their Impact",
            excerpt: "How weather and track conditions affect horse performance.",
            thumbnail: "assets/images/edu_area_video5.jpg",
            level: "intermediate",
            tags: ["basics-to-racing"],
            videoIndex: 4,
            views: 920,
            date: "2024-03-01"
        },
        {
            id: 11,
            title: "Exotic Bets Explained",
            excerpt: "Learn about Trifecta, First 4, and other exotic betting options.",
            thumbnail: "assets/images/edu_area_video1.jpg",
            level: "advanced",
            tags: ["bet-type"],
            videoIndex: 0,
            views: 780,
            date: "2024-03-05"
        },
        {
            id: 12,
            title: "Master Level: Portfolio Management",
            excerpt: "Advanced bankroll management and betting portfolio strategies.",
            thumbnail: "assets/images/edu_area_video2.jpg",
            level: "master",
            tags: ["betting-strategy"],
            videoIndex: 1,
            views: 420,
            date: "2024-03-10"
        },
        {
            id: 13,
            title: "Getting Started with Racing",
            excerpt: "Your first steps into the exciting world of horse racing.",
            thumbnail: "assets/images/edu_area_video3.jpg",
            level: "beginner",
            tags: ["racing-kickstarter"],
            videoIndex: 2,
            views: 1350,
            date: "2024-03-15"
        },
        {
            id: 14,
            title: "Pace Analysis for Beginners",
            excerpt: "Understanding race pace and its importance in betting.",
            thumbnail: "assets/images/edu_area_video4.jpg",
            level: "intermediate",
            tags: ["basics-to-racing"],
            videoIndex: 3,
            views: 760,
            date: "2024-03-20"
        },
        {
            id: 15,
            title: "Multi-Leg Betting Strategies",
            excerpt: "Maximize returns with sophisticated multi-leg bet combinations.",
            thumbnail: "assets/images/edu_area_video5.jpg",
            level: "expert",
            tags: ["betting-strategy"],
            videoIndex: 4,
            views: 490,
            date: "2024-03-25"
        },
        {
            id: 16,
            title: "Reading the Odds Board",
            excerpt: "Understand how to read and interpret betting odds effectively.",
            thumbnail: "assets/images/edu_area_video1.jpg",
            level: "beginner",
            tags: ["bet-type"],
            videoIndex: 0,
            views: 1280,
            date: "2024-03-30"
        }
    ];

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

        // Render grouped posts
        const levelNames = {
            'beginner': 'Beginner',
            'intermediate': 'Intermediate',
            'advanced': 'Advanced',
            'expert': 'Expert',
            'master': 'Master'
        };

        const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];

        levelOrder.forEach(level => {
            if (groupedPosts[level] && groupedPosts[level].length > 0) {
                const $levelGroup = $('<div class="level-group"></div>');
                const $levelTitle = $(`<h2 class="level-group-title">${levelNames[level]}</h2>`);
                const $levelPosts = $('<div class="level-group-posts"></div>');

                groupedPosts[level].forEach(post => {
                    const postCard = createPostCard(post);
                    $levelPosts.append(postCard);
                });

                $levelGroup.append($levelTitle);
                $levelGroup.append($levelPosts);
                $grid.append($levelGroup);
            }
        });

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
    function createPostCard(post) {
        const categoryTag = post.tags[0].split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        return $(`
            <div class="post-card" data-level="${post.level}" data-tags="${post.tags.join(',')}" data-video-index="${post.videoIndex}">
                <div class="post-thumbnail">
                    <img src="${post.thumbnail}" alt="${post.title}">
                    <div class="post-play-icon">
                        <i class="fa-solid fa-play"></i>
                    </div>
                </div>
                <div class="post-content">
                    <div class="post-tags">
                        <span class="post-tag level-${post.level}">${capitalizeFirst(post.level)}</span>
                        <span class="post-tag category">${categoryTag}</span>
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

        // Sort/Filter button - open modal
        $('#sortFilterBtn').on('click', function(e) {
            e.stopPropagation();
            $('#sortFilterModal').addClass('active');
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
