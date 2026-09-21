import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

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

const authors = [
  { name: '李明轩', avatar: 'https://i.pravatar.cc/150?img=11' },
  { name: '王小厨', avatar: 'https://i.pravatar.cc/150?img=32' },
  { name: '张读书', avatar: 'https://i.pravatar.cc/150?img=45' },
  { name: '旅行者老王', avatar: 'https://i.pravatar.cc/150?img=52' },
  { name: '林小雅', avatar: 'https://i.pravatar.cc/150?img=47' },
  { name: '张前端', avatar: 'https://i.pravatar.cc/150?img=15' },
  { name: '陈默', avatar: 'https://i.pravatar.cc/150?img=33' },
  { name: '影评人小赵', avatar: 'https://i.pravatar.cc/150?img=28' },
  { name: '周思考', avatar: 'https://i.pravatar.cc/150?img=12' },
  { name: '成都吃货', avatar: 'https://i.pravatar.cc/150?img=55' }
];

const tagPool = {
  '技术': ['JavaScript', 'Vue3', 'React', 'TypeScript', 'Node.js', 'CSS', '前端', '后端', '性能优化', '最佳实践'],
  '生活': ['生活方式', '独居', '治愈', '健康', '习惯', '宠物', '租房', '周末', '成长', '家庭'],
  '随笔': ['随笔', '深夜', '感悟', '故事', '人生', '孤独', '情绪', '回忆', '记录', '城市'],
  '读书': ['读书', '读书笔记', '心理学', '哲学', '成长', '经典', '小说', '非虚构', '传记', '方法'],
  '旅行': ['旅行', '攻略', '自驾游', '徒步', '美食', '拍照', '住宿', '周末游', '闺蜜游', '背包客'],
  '美食': ['美食', '菜谱', '家常菜', '烘焙', '甜品', '早餐', '地方菜', '街头小吃', '烹饪', '素食'],
  '思考': ['思考', '认知', '底层逻辑', '时间管理', '自律', '赚钱', '效率', '人生意义', '选择', '思维模型'],
  '影评': ['影评', '电影', '科幻', '动画', '剧情', '悬疑', '纪录片', '经典', '皮克斯', '诺兰']
};

const titlePool = {
  '技术': [
    '深入理解 {tag} 的工作原理',
    '{tag} 最佳实践与常见坑点总结',
    '从零开始学 {tag}：保姆级教程',
    '{tag} 性能优化：从入门到精通',
    '关于 {tag}，你需要知道的一切',
    '我是如何用 {tag} 解决实际问题的',
    '{tag} 源码阅读笔记',
    '面试官最爱的 {tag} 面试题汇总'
  ],
  '生活': [
    '我的 {tag} 小习惯，让生活越来越美好',
    '关于 {tag}，这是我一年来的心得',
    '一个人也要好好 {tag}',
    '学会 {tag}，是成年人的必修课',
    '我家的 {tag} 好物分享',
    '用最低的成本，实现 {tag} 自由',
    '和自己和解：我的 {tag} 之路',
    '那些让我幸福感爆棚的 {tag} 小事'
  ],
  '随笔': [
    '关于 {tag}，我想说几句掏心窝子的话',
    '深夜随笔：谈谈 {tag} 这件事',
    '写给正在经历 {tag} 的你',
    '人到中年，终于懂了 {tag}',
    '我生命中那些关于 {tag} 的瞬间',
    '城市角落的 {tag} 故事',
    '如果你也正在感受 {tag}',
    '一段关于 {tag} 的自言自语'
  ],
  '读书': [
    '《{tag}》：一本改变我认知的书',
    '《{tag}》读后感：终于有人把这事说透了',
    '读了三遍《{tag}》，我提炼出这些精华',
    '《{tag}》书评：写给每一个迷茫的人',
    '年度最佳！《{tag}》读书笔记',
    '为什么我建议每个人都读《{tag}》',
    '《{tag}》金句摘录与深度解读',
    '从《{tag}》看人生的底层逻辑'
  ],
  '旅行': [
    '{tag} 完全攻略：看这一篇就够了',
    '我的 {tag} 之旅：那些意外的惊喜',
    '人均千元玩转 {tag}，超详细预算表',
    '为什么我建议你一定要去一次 {tag}',
    '{tag} 小众秘境：避开人潮的好去处',
    '辞职去 {tag} 待了一个月，我收获了什么',
    '带着闺蜜去 {tag}：一份女生专属攻略',
    '{tag} 必打卡的 N 个地方，你去过几个？'
  ],
  '美食': [
    '我家的祖传 {tag} 配方，传女不传男',
    '零失败的 {tag} 做法，新手也能一次成功',
    '关于 {tag} 的 N 种吃法，你最爱哪种？',
    '在家也能做的正宗 {tag}，比饭店还好吃',
    '夏天必备：6款 {tag} 做法，清凉解暑',
    '我做了十年 {tag}，总结出这些秘诀',
    '朋友圈点赞最多的 {tag} 做法，学会就是赚到',
    '{tag} 怎么做好吃？试过 N 种方法后找到了答案'
  ],
  '思考': [
    '关于 {tag}，这是我思考了很久的答案',
    '三十岁才明白的 {tag} 真相',
    '真正厉害的人，都懂这个 {tag} 道理',
    '颠覆认知的 {tag} 底层逻辑',
    '为什么我说 {tag} 是一个伪命题',
    '关于 {tag} 的 5 个反常识真相',
    '提升 {tag} 能力，只需要这三步',
    '绝大多数人，都误解了 {tag}'
  ],
  '影评': [
    '《{tag}》：被严重低估的神作',
    '《{tag}》影评：它不止是一部电影',
    '看完《{tag}》，我失眠了整整三天',
    '深度解析《{tag}》的 10 个隐藏细节',
    '《{tag}》为什么能成为影史经典？',
    '二刷《{tag}》，终于看懂了这些隐喻',
    '《{tag}》：写给成年人的童话',
    '为什么说《{tag}》是今年最好的电影'
  ]
};

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMarkdown(category, title, tags) {
  const emojis = categoryEmojis[category] || '';
  return `# ${title}\n\n## 引言\n\n${emojis} 这是一篇关于**${category}**的文章。\n\n在正式开始之前，想和大家聊几句。\n\n> \"关于 ${tags[0] || category}，每个人都有自己的理解。\"\n\n希望这篇文章，能给你带来一点点启发。\n\n## 为什么要讨论这个话题？\n\n生活中我们经常遇到这样的问题：\n\n| 常见误区 | 正确认知 |\n|---------|--------|\n| 认为 ${tags[0] || category} 很难 | 其实只要找对方法，一点都不难 |\n| 觉得自己不适合 | 每个人都可以学会 |\n| 想要速成 | 打好基础才是王道 |\n\n## 核心观点\n\n### 第一点：打好基础最重要\n\n很多人一上来就追求高级技巧，结果反而走了弯路。\n\n```\n先学会走，再学跑。\n这句话放在任何领域都适用。\n```\n\n### 第二点：持续练习是关键\n\n任何技能都需要刻意练习。以下是三个实用建议：\n\n1. 每天花固定时间做这件事\n2. 找到反馈机制，知道自己哪里错了\n3. 定期复盘，总结经验教训\n\n### 第三点：找到适合自己的方法\n\n别人的方法不一定适合你。\n\n> 适合自己的，才是最好的。\n\n可以多尝试几种，然后留下最舒服的那种。\n\n## 实战案例\n\n我有一个朋友，之前完全不懂 ${tags[0] || category}。\n\n但她每天坚持花两个小时学习，三个月之后，就发生了翻天覆地的变化。\n\n| 时间 | 状态 |\n|------|------|\n| 第1周 | 连入门都困难 |\n| 第1个月 | 能独立完成简单任务 |\n| 第3个月 | 可以教别人了 |\n\n所以说，**不要给自己设限**。\n\n## 常见问题解答\n\n### Q1：零基础可以学会吗？\n\n完全可以！谁都是从零开始的。\n\n### Q2：需要多长时间才能掌握？\n\n因人而异。但按照正确方法，每天坚持，3-6个月会有明显进步。\n\n### Q3：遇到瓶颈怎么办？\n\n```\n1. 休息一下，放松心态\n2. 找高手请教\n3. 换个角度看问题\n4. 回到基础，重新梳理\n```\n\n## 推荐资源\n\n- 书籍：相关领域的经典书 2-3 本\n- 网站：行业内公认的优质学习平台\n- 社群：找到同频的人一起进步\n- 实践：**最重要的一点！光学不练假把式**\n\n## 总结\n\n回顾一下，今天讲了这几个重点：\n\n1. 打好基础，不要急功近利\n2. 持续练习，用数量堆出质量\n3. 找到方法，适合自己的最重要\n4. 不要怕错，犯错是最好的学习\n\n---\n\n希望这篇文章对你有帮助。\n\n如果你觉得有用，欢迎**点赞收藏**，也欢迎在评论区留下你的想法。\n\n我们下一篇文章见！✨\n\n> 本文标签：${tags.map(t => '#' + t).join(' ')}\n`;
}

function generatePosts(count = 32) {
  const posts = [];
  const startDate = new Date('2025-06-01');
  const endDate = new Date('2026-07-30');

  for (let i = 1; i <= count; i++) {
    const category = categories[(i - 1) % categories.length];
    const catTags = tagPool[category];
    const numTags = randomInt(3, 5);
    const selectedTags = [];
    const shuffled = [...catTags].sort(() => Math.random() - 0.5);
    for (let j = 0; j < numTags && j < shuffled.length; j++) {
      selectedTags.push(shuffled[j]);
    }

    const template = randomChoice(titlePool[category]);
    const tagForTitle = selectedTags[0] || category;
    const title = template.replace('{tag}', tagForTitle);

    const author = randomChoice(authors);
    const publishDate = randomDate(startDate, endDate);

    posts.push({
      id: i,
      title,
      summary: `这是一篇关于${category}的文章，主题是${tagForTitle}。内容涵盖了核心概念、实战技巧、常见问题等，希望能给读者带来启发和帮助。`,
      coverImage: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(category + ' ' + tagForTitle + ' illustration blog cover modern design')}&image_size=landscape_16_9`,
      author: author.name,
      authorAvatar: author.avatar,
      publishDate,
      category,
      tags: selectedTags,
      readingMinutes: randomInt(5, 20),
      viewCount: randomInt(500, 8000),
      likeCount: randomInt(50, 700),
      commentCount: randomInt(10, 200),
      content: generateMarkdown(category, title, selectedTags)
    });
  }

  posts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  posts.forEach((post, index) => { post.id = index + 1; });

  return posts;
}

function fetchFromRemote(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogFetcher/1.0)' },
      timeout
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

function savePosts(posts) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`✅ 已保存 ${posts.length} 篇文章到 ${DATA_FILE}`);
}

async function main() {
  console.log('📚 开始获取博客文章数据...\n');

  const remoteUrls = [
    'https://api.example.com/posts',
    'https://raw.githubusercontent.com/example/blog-data/main/data.json'
  ];

  let data = null;

  for (const url of remoteUrls) {
    console.log(`🔍 尝试从远程获取: ${url}`);
    try {
      const result = await fetchFromRemote(url);
      if (Array.isArray(result) && result.length > 0) {
        data = result;
        console.log(`✅ 成功获取 ${result.length} 篇文章！\n`);
        break;
      } else if (result && Array.isArray(result.posts) && result.posts.length > 0) {
        data = result.posts;
        console.log(`✅ 成功获取 ${result.posts.length} 篇文章！\n`);
        break;
      }
    } catch (e) {
      console.log(`❌ 获取失败: ${e.message}\n`);
    }
  }

  if (!data || data.length === 0) {
    console.log('⚠️  远程获取失败，正在生成示例文章数据...');
    data = generatePosts(32);
    console.log('✅ 示例数据生成完成！\n');
  }

  savePosts(data);

  console.log('\n📊 数据统计:');
  const categoryCount = {};
  data.forEach(p => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });
  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`  ${categoryEmojis[cat] || '  '} ${cat}: ${count} 篇`);
  });
  console.log(`\n🎉 总计: ${data.length} 篇文章`);
}

main().catch((e) => {
  console.error('❌ 出错了:', e.message);
  console.log('⚠️  正在回退到示例数据生成...');
  const data = generatePosts(32);
  savePosts(data);
  process.exit(0);
});
