(function () {
  'use strict';

  const state = {
    posts: [],
    filteredPosts: [],
    currentRoute: { type: 'home' },
    currentSort: 'newest',
    searchKeyword: '',
    searchTimer: null,
    theme: 'light'
  };

  const categories = ['技术', '生活', '随笔', '读书', '旅行', '美食', '思考', '影评'];
  const categoryEmojis = {
    '技术': '💻',
    '生活': '🏠',
    '随笔': '📖',
    '读书': '📚',
    '旅行': '✈️',
    '美食': '🍜',
    '思考': '💭',
    '影评': '🎬'
  };

  function resolveDataPath() {
    const base = window.location.pathname.replace(/index\.html$/, '');
    return base + 'data/data.json';
  }

  async function loadPosts() {
    try {
      const response = await fetch(resolveDataPath(), { cache: 'no-cache' });
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      state.posts = Array.isArray(data) ? data : (data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
      state.posts = generateFallbackPosts();
    }
    state.filteredPosts = [...state.posts];
  }

  function generateFallbackPosts() {
    return [];
  }

  function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => overlay.style.display = 'none', 300);
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('blog-theme');
    if (savedTheme) {
      state.theme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      state.theme = 'dark';
    }
    applyTheme();

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('blog-theme')) {
          state.theme = e.matches ? 'dark' : 'light';
          applyTheme();
        }
      });
    }
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('blog-theme', state.theme);
    applyTheme();
  }

  function renderMarkdown(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    html = html.replace(/^ {0,3}```([\s\S]*?)```\s*$/gm, (match, code) => {
      const langMatch = code.match(/^([^\n]*)\n/);
      let lang = '';
      let codeContent = code;
      if (langMatch) {
        lang = langMatch[1].trim();
        codeContent = code.slice(langMatch[0].length);
      }
      return `<pre><code class="language-${lang}">${codeContent.replace(/^\n+|\n+$/g, '')}</code></pre>`;
    });

    html = html.replace(/^ {0,3}(`{1,2})([\s\S]*?)\1\s*$/gm, (match, _, code) => {
      return `<pre><code>${code.replace(/^\n+|\n+$/g, '')}</code></pre>`;
    });

    html = html.replace(/^\s*\|(.+)\|\s*$/gm, (match, content) => {
      return match;
    });

    const tableRegex = /(^\s*\|.+\|\s*\n^\s*\|[\s:|-]+\|\s*\n(?:^\s*\|.+\|\s*\n?)+)/gm;
    html = html.replace(tableRegex, (table) => {
      const lines = table.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) return table;

      const headers = parseTableRow(lines[0]);
      const rows = lines.slice(2).map(parseTableRow);

      let thead = '<thead><tr>';
      headers.forEach(h => thead += `<th>${renderInlineMarkdown(h)}</th>`);
      thead += '</tr></thead>';

      let tbody = '<tbody>';
      rows.forEach(row => {
        tbody += '<tr>';
        row.forEach(cell => tbody += `<td>${renderInlineMarkdown(cell)}</td>`);
        tbody += '</tr>';
      });
      tbody += '</tbody>';

      return `<table>${thead}${tbody}</table>`;
    });

    html = html.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
      const level = hashes.length;
      return `<h${level}>${renderInlineMarkdown(text.trim())}</h${level}>`;
    });

    html = html.replace(/^ {0,3}>(.*)$/gm, (match, content) => {
      return `<blockquote>${renderInlineMarkdown(content.trim())}</blockquote>`;
    });

    html = mergeAdjacentElements(html, 'blockquote');

    html = html.replace(/^(\s*\d+\.\s+.+)$/gm, (match) => match);
    html = html.replace(/^(\s*[-*+]\s+.+)$/gm, (match) => match);

    const olRegex = /((?:^\s*\d+\.\s+.+\n?)+)/gm;
    html = html.replace(olRegex, (list) => {
      const items = list.trim().split('\n').filter(l => l.trim());
      const rendered = items.map(item => {
        const text = item.replace(/^\s*\d+\.\s+/, '');
        return `<li>${renderInlineMarkdown(text.trim())}</li>`;
      }).join('');
      return `<ol>${rendered}</ol>`;
    });

    const ulRegex = /((?:^\s*[-*+]\s+.+\n?)+)/gm;
    html = html.replace(ulRegex, (list) => {
      const items = list.trim().split('\n').filter(l => l.trim());
      const rendered = items.map(item => {
        const text = item.replace(/^\s*[-*+]\s+/, '');
        return `<li>${renderInlineMarkdown(text.trim())}</li>`;
      }).join('');
      return `<ul>${rendered}</ul>`;
    });

    html = html.replace(/^ {0,3}([-*_])\s*\1\s*\1(?:\s|[*-_])*$/gm, '<hr>');

    html = html.split(/\n{2,}/).map(block => {
      if (/^<(h[1-6]|pre|blockquote|table|ol|ul|hr)/i.test(block.trim())) {
        return block;
      }
      return `<p>${block.trim().split('\n').map(line => renderInlineMarkdown(line)).join('<br>')}</p>`;
    }).join('\n');

    return html;
  }

  function parseTableRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim());
  }

  function mergeAdjacentElements(html, tag) {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>(?:\\s*<${tag}>([\\s\\S]*?)</${tag}>)+`, 'g');
    return html.replace(regex, (match) => {
      const contents = [];
      const innerRegex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
      let m;
      while ((m = innerRegex.exec(match)) !== null) {
        contents.push(m[1]);
      }
      return `<${tag}>${contents.join('<br>')}</${tag}>`;
    });
  }

  function renderInlineMarkdown(text) {
    if (!text) return '';
    let result = text;

    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');

    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');

    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');

    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    result = result.replace(/`([^`]+)`/g, (match, code) => {
      return `<code>${code}</code>`;
    });

    return result;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateTime(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }

  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return formatDate(dateString);
  }

  function getAvatarInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<span class="highlight-keyword">$1</span>');
  }

  function getAllTags() {
    const tagMap = new Map();
    state.posts.forEach(post => {
      (post.tags || []).forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }

  function getArchiveData() {
    const archiveMap = new Map();
    state.posts.forEach(post => {
      const date = new Date(post.publishDate);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        if (!archiveMap.has(year)) archiveMap.set(year, new Map());
        archiveMap.get(year).set(month, (archiveMap.get(year).get(month) || 0) + 1);
      }
    });
    return Array.from(archiveMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => ({
        year,
        months: Array.from(months.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([month, count]) => ({ month, count, key: `${year}-${String(month).padStart(2, '0')}` }))
      }));
  }

  function renderTagCloud() {
    const tagCloud = document.getElementById('tagCloud');
    if (!tagCloud) return;

    const tags = getAllTags();
    if (tags.length === 0) {
      tagCloud.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;">暂无标签</p>';
      return;
    }

    const maxCount = tags[0][1];
    const minCount = tags[tags.length - 1][1];
    const range = maxCount - minCount || 1;

    tagCloud.innerHTML = tags.map(([tag, count]) => {
      const sizeLevel = Math.min(6, Math.ceil(((count - minCount) / range) * 5) + 1);
      const isActive = state.currentRoute.type === 'tag' && state.currentRoute.tag === tag;
      return `<a href="#/tag/${encodeURIComponent(tag)}" class="tag-chip size-${sizeLevel}" data-tag="${encodeURIComponent(tag)}" style="${isActive ? 'background-color:var(--accent-primary);color:#fff;border-color:var(--accent-primary);' : ''}">${escapeHtml(tag)} <span style="opacity:0.7;font-size:0.85em;">(${count})</span></a>`;
    }).join('');
  }

  function renderArchiveTimeline() {
    const timeline = document.getElementById('archiveTimeline');
    if (!timeline) return;

    const archives = getArchiveData();
    if (archives.length === 0) {
      timeline.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;">暂无归档</p>';
      return;
    }

    timeline.innerHTML = archives.map(group => `
      <div class="archive-year-group">
        <div class="archive-year">${group.year}年</div>
        <ul class="archive-months">
          ${group.months.map(m => {
            const isActive = state.currentRoute.type === 'archive' && state.currentRoute.date === m.key;
            return `<li class="archive-month-item">
              <a href="#/archive/${m.key}" class="archive-month-link" style="${isActive ? 'color:var(--accent-primary);font-weight:600;' : ''}">
                <span>${m.month}月</span>
                <span class="archive-count">${m.count}篇</span>
              </a>
            </li>`;
          }).join('')}
        </ul>
      </div>
    `).join('');
  }

  function renderCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      const cat = tab.dataset.category;
      let isActive = false;
      if (cat === 'all' && state.currentRoute.type === 'home') isActive = true;
      if (state.currentRoute.type === 'category' && state.currentRoute.category === cat) isActive = true;
      tab.classList.toggle('active', isActive);
    });
  }

  function renderFilterInfo() {
    const info = document.getElementById('filterInfo');
    if (!info) return;

    let text = `共 <strong>${state.filteredPosts.length}</strong> 篇文章`;
    const route = state.currentRoute;

    if (route.type === 'category') {
      const emoji = categoryEmojis[route.category] || '';
      text = `分类 <strong>${emoji} ${route.category}</strong> 下共 <strong>${state.filteredPosts.length}</strong> 篇文章`;
    } else if (route.type === 'tag') {
      text = `标签 <strong>#${route.tag}</strong> 下共 <strong>${state.filteredPosts.length}</strong> 篇文章`;
    } else if (route.type === 'archive') {
      const [y, m] = route.date.split('-');
      text = `<strong>${y}年${parseInt(m)}月</strong> 共 <strong>${state.filteredPosts.length}</strong> 篇文章`;
    }

    if (state.searchKeyword) {
      text += ` · 搜索 "<strong>${escapeHtml(state.searchKeyword)}</strong>"`;
    }

    info.innerHTML = text;
  }

  function renderPostGrid() {
    const grid = document.getElementById('postGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;

    if (state.filteredPosts.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = state.filteredPosts.map(post => {
      const title = highlightKeyword(escapeHtml(post.title), state.searchKeyword);
      const summary = highlightKeyword(escapeHtml(post.summary || ''), state.searchKeyword);
      const authorName = highlightKeyword(escapeHtml(post.author || '匿名'), state.searchKeyword);

      return `
        <article class="post-card fade-in" data-id="${post.id}" onclick="window.location.hash='#/post/${post.id}'">
          <div class="post-cover" style="background-image:url('${escapeHtml(post.coverImage || '')}')"></div>
          <div class="post-card-content">
            <span class="post-category">${categoryEmojis[post.category] || ''} ${escapeHtml(post.category || '')}</span>
            <h2 class="post-title">${title}</h2>
            <p class="post-summary">${summary}</p>
            <div class="post-tags">
              ${(post.tags || []).slice(0, 4).map(tag => {
                const t = highlightKeyword(escapeHtml(tag), state.searchKeyword);
                return `<span class="post-tag" onclick="event.stopPropagation();window.location.hash='#/tag/${encodeURIComponent(tag)}'">#${t}</span>`;
              }).join('')}
            </div>
            <div class="post-meta">
              <div class="post-author">
                <div class="author-avatar" style="background-image:url('${escapeHtml(post.authorAvatar || '')}')"></div>
                <span class="author-name">${authorName}</span>
              </div>
              <div class="post-meta-item" title="${formatDateTime(post.publishDate)}">
                <span>📅</span>
                <span>${formatDate(post.publishDate)}</span>
              </div>
              <div class="post-stats">
                <div class="post-meta-item" title="阅读时长">
                  <span>⏱️</span>
                  <span>${post.readingMinutes || 5}分钟</span>
                </div>
                <div class="post-meta-item" title="阅读量">
                  <span>👁️</span>
                  <span>${post.viewCount || 0}</span>
                </div>
                <div class="post-meta-item" title="评论">
                  <span>💬</span>
                  <span>${post.commentCount || 0}</span>
                </div>
                <div class="post-meta-item" title="点赞">
                  <span>❤️</span>
                  <span>${post.likeCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderPostDetail(post) {
    const detail = document.getElementById('postDetail');
    if (!detail || !post) return;

    const contentHtml = renderMarkdown(post.content || '');

    detail.innerHTML = `
      <div class="post-detail-cover" style="background-image:url('${escapeHtml(post.coverImage || '')}')"></div>
      <div class="post-detail-header">
        <span class="post-detail-category">${categoryEmojis[post.category] || ''} ${escapeHtml(post.category || '')}</span>
        <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
        <div class="post-detail-info">
          <div class="post-detail-author">
            <div class="author-avatar" style="background-image:url('${escapeHtml(post.authorAvatar || '')}')"></div>
            <div>
              <div class="author-name">${escapeHtml(post.author || '匿名')}</div>
              <div style="font-size:12px;color:var(--text-tertiary);">${formatRelativeTime(post.publishDate)}</div>
            </div>
          </div>
          <div class="post-detail-meta">
            <div class="post-meta-item">
              <span>📅</span>
              <span>${formatDate(post.publishDate)}</span>
            </div>
            <div class="post-meta-item">
              <span>⏱️</span>
              <span>${post.readingMinutes || 5} 分钟阅读</span>
            </div>
            <div class="post-meta-item">
              <span>👁️</span>
              <span>${post.viewCount || 0} 阅读</span>
            </div>
            <div class="post-meta-item">
              <span>💬</span>
              <span>${post.commentCount || 0} 评论</span>
            </div>
            <div class="post-meta-item">
              <span>❤️</span>
              <span>${post.likeCount || 0} 点赞</span>
            </div>
          </div>
        </div>
        <div class="post-detail-tags">
          ${(post.tags || []).map(tag => `<a href="#/tag/${encodeURIComponent(tag)}" class="post-tag">#${escapeHtml(tag)}</a>`).join('')}
        </div>
      </div>
      <div class="post-detail-content">
        <div class="markdown-body">${contentHtml}</div>
      </div>
    `;
  }

  function renderPostNavigation(currentPost) {
    const nav = document.getElementById('postNavigation');
    if (!nav || !currentPost) return;

    const sortedByDate = [...state.posts].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    const index = sortedByDate.findIndex(p => p.id === currentPost.id);
    const prevPost = index < sortedByDate.length - 1 ? sortedByDate[index + 1] : null;
    const nextPost = index > 0 ? sortedByDate[index - 1] : null;

    nav.innerHTML = `
      ${prevPost ? `
        <a href="#/post/${prevPost.id}" class="nav-card prev">
          <span class="nav-label">← 上一篇</span>
          <span class="nav-title">${escapeHtml(prevPost.title)}</span>
        </a>
      ` : '<div></div>'}
      ${nextPost ? `
        <a href="#/post/${nextPost.id}" class="nav-card next">
          <span class="nav-label">下一篇 →</span>
          <span class="nav-title">${escapeHtml(nextPost.title)}</span>
        </a>
      ` : '<div></div>'}
    `;
  }

  function renderRelatedPosts(currentPost) {
    const section = document.getElementById('relatedPosts');
    if (!section || !currentPost) return;

    const relatedByTag = state.posts.filter(p =>
      p.id !== currentPost.id &&
      p.tags && currentPost.tags &&
      p.tags.some(t => currentPost.tags.includes(t))
    );

    const relatedByCategory = state.posts.filter(p =>
      p.id !== currentPost.id && p.category === currentPost.category
    );

    const merged = new Map();
    [...relatedByTag, ...relatedByCategory].forEach(p => merged.set(p.id, p));
    const related = Array.from(merged.values()).slice(0, 6);

    if (related.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    section.innerHTML = `
      <h3>📎 相关推荐</h3>
      <div class="related-grid">
        ${related.map(post => `
          <div class="related-item" onclick="window.location.hash='#/post/${post.id}'">
            <div class="related-item-title">${escapeHtml(post.title)}</div>
            <div class="related-item-meta">
              <span>${formatDate(post.publishDate)}</span>
              <span>👁️ ${post.viewCount || 0}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function getComments(postId) {
    try {
      const data = localStorage.getItem(`blog-comments-${postId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveComments(postId, comments) {
    try {
      localStorage.setItem(`blog-comments-${postId}`, JSON.stringify(comments));
    } catch (e) {
      console.error('Failed to save comments:', e);
      showToast('评论保存失败', 'error');
    }
  }

  function renderComments(postId) {
    const list = document.getElementById('commentsList');
    if (!list) return;

    const comments = getComments(postId);

    if (comments.length === 0) {
      list.innerHTML = '<div class="empty-comments">📝 还没有评论，快来发表第一条评论吧！</div>';
      return;
    }

    list.innerHTML = comments.map(c => `
      <div class="comment-card fade-in">
        <div class="comment-header">
          <div class="comment-author-info">
            <div class="comment-avatar">${escapeHtml(getAvatarInitial(c.nickname))}</div>
            <div>
              <div class="comment-nickname">${escapeHtml(c.nickname || '匿名用户')}</div>
              <div class="comment-time">${formatRelativeTime(c.time)}</div>
            </div>
          </div>
          <button class="comment-delete" data-id="${c.id}" title="删除评论">删除</button>
        </div>
        <div class="comment-content">${escapeHtml(c.content).replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');

    list.querySelectorAll('.comment-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteComment(postId, btn.dataset.id));
    });
  }

  function addComment(postId) {
    const nicknameInput = document.getElementById('commentNickname');
    const contentInput = document.getElementById('commentContent');
    if (!nicknameInput || !contentInput) return;

    const nickname = nicknameInput.value.trim();
    const content = contentInput.value.trim();

    if (!nickname) {
      showToast('请输入您的昵称', 'error');
      nicknameInput.focus();
      return;
    }
    if (!content) {
      showToast('请输入评论内容', 'error');
      contentInput.focus();
      return;
    }

    const comments = getComments(postId);
    const newComment = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      nickname,
      content,
      time: new Date().toISOString()
    };
    comments.unshift(newComment);
    saveComments(postId, comments);
    renderComments(postId);

    nicknameInput.value = '';
    contentInput.value = '';
    showToast('评论发表成功！', 'success');
  }

  function deleteComment(postId, commentId) {
    if (!confirm('确定要删除这条评论吗？')) return;
    const comments = getComments(postId).filter(c => c.id !== commentId);
    saveComments(postId, comments);
    renderComments(postId);
    showToast('评论已删除');
  }

  function bindCommentEvents(postId) {
    const submitBtn = document.getElementById('submitCommentBtn');
    if (submitBtn) {
      submitBtn.onclick = () => addComment(postId);
    }
    const contentInput = document.getElementById('commentContent');
    if (contentInput) {
      contentInput.onkeydown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') addComment(postId);
      };
    }
  }

  function applyFilters() {
    let posts = [...state.posts];
    const route = state.currentRoute;

    if (route.type === 'category') {
      posts = posts.filter(p => p.category === route.category);
    } else if (route.type === 'tag') {
      posts = posts.filter(p => p.tags && p.tags.includes(route.tag));
    } else if (route.type === 'archive') {
      posts = posts.filter(p => {
        const d = new Date(p.publishDate);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === route.date;
      });
    }

    if (state.searchKeyword) {
      const kw = state.searchKeyword.toLowerCase();
      posts = posts.filter(p => {
        const title = (p.title || '').toLowerCase();
        const summary = (p.summary || '').toLowerCase();
        const content = (p.content || '').toLowerCase();
        const author = (p.author || '').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        return title.includes(kw) || summary.includes(kw) || content.includes(kw) || author.includes(kw) || tags.includes(kw);
      });
    }

    applySort(posts);
    state.filteredPosts = posts;
  }

  function applySort(posts) {
    switch (state.currentSort) {
      case 'hottest':
        posts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case 'most-comments':
        posts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      case 'newest':
      default:
        posts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    }
  }

  function renderHome() {
    applyFilters();
    renderFilterInfo();
    renderPostGrid();
  }

  function renderDetail(postId) {
    const post = state.posts.find(p => String(p.id) === String(postId));
    if (!post) {
      document.getElementById('homeView').style.display = 'block';
      document.getElementById('detailView').style.display = 'none';
      renderFilterInfo();
      renderPostGrid();
      showToast('文章不存在', 'error');
      return;
    }

    document.getElementById('homeView').style.display = 'none';
    document.getElementById('detailView').style.display = 'block';

    renderPostDetail(post);
    renderPostNavigation(post);
    renderRelatedPosts(post);
    renderComments(post.id);
    bindCommentEvents(post.id);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchView(view) {
    const homeView = document.getElementById('homeView');
    const detailView = document.getElementById('detailView');
    if (!homeView || !detailView) return;

    if (view === 'home') {
      homeView.style.display = 'block';
      detailView.style.display = 'none';
    } else {
      homeView.style.display = 'none';
      detailView.style.display = 'block';
    }
  }

  function parseHash() {
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);

    if (parts.length === 0) {
      return { type: 'home' };
    }

    const route = parts[0];
    switch (route) {
      case 'post':
        return { type: 'detail', id: decodeURIComponent(parts[1] || '') };
      case 'category':
        return { type: 'category', category: decodeURIComponent(parts[1] || '') };
      case 'tag':
        return { type: 'tag', tag: decodeURIComponent(parts[1] || '') };
      case 'archive':
        return { type: 'archive', date: decodeURIComponent(parts[1] || '') };
      default:
        return { type: 'home' };
    }
  }

  function handleRoute() {
    const newRoute = parseHash();
    state.currentRoute = newRoute;

    renderCategoryTabs();
    renderTagCloud();
    renderArchiveTimeline();

    if (newRoute.type === 'detail') {
      switchView('detail');
      renderDetail(newRoute.id);
    } else {
      switchView('home');
      renderHome();
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    }
  }

  function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    if (state.searchKeyword) {
      input.value = state.searchKeyword;
    }

    input.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => {
        state.searchKeyword = value;
        if (state.currentRoute.type === 'detail') {
          window.location.hash = '#/';
        } else {
          renderHome();
        }
      }, 300);
    });
  }

  function initSort() {
    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sortBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentSort = btn.dataset.sort;
        renderHome();
      });
    });
  }

  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function showToast(message, type = 'info') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast visible ' + type;
    setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  async function init() {
    initTheme();
    try {
      await loadPosts();
    } catch (e) {
      console.error(e);
    }
    initSearch();
    initSort();
    initBackToTop();
    handleRoute();
    hideLoading();
    window.addEventListener('hashchange', handleRoute);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
