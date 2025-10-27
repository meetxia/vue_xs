(function () {
  'use strict';

  // ---------- Utilities ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function formatDate(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function shortId(id) {
    return id.slice(0, 7);
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function generateCommitId(counter) {
    // simple pseudo-hash: counter + random base36
    return (
      counter.toString(16).padStart(4, '0') +
      Math.random().toString(16).slice(2, 10)
    ).slice(0, 12);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ---------- Git Simulator State ----------
  const state = {
    config: {
      userName: '',
      userEmail: '',
    },
    repo: {
      initialized: false,
      branches: {}, // name -> commitId
      headBranch: null, // string
      commits: {}, // id -> { id, message, parents: [], tree: { filename: content }, author, timestamp }
      index: {}, // filename -> content (staged content)
      working: {}, // filename -> { content: string, tracked: boolean }
      remote: {
        url: null,
        branches: {}, // name -> commitId
      },
      historyCounter: 0,
    },
    ui: {
      selectedFile: null,
      editorDirty: false,
    },
  };

  // ---------- DOM Elements ----------
  const dom = {
    btnReset: $('#btn-reset'),
    btnFillDemo: $('#btn-fill-demo'),
    stepsList: $('#steps-list'),
    progressBar: $('#progress-bar'),

    newFileName: $('#new-file-name'),
    btnCreateFile: $('#btn-create-file'),
    workingFiles: $('#working-files'),
    stagingFiles: $('#staging-files'),
    commitHistory: $('#commit-history'),
    branchInfo: $('#branch-info'),

    editorFilename: $('#editor-filename'),
    editorContent: $('#editor-content'),
    btnStageCurrent: $('#btn-stage-current'),
    btnDiscardCurrent: $('#btn-discard-current'),
    btnSaveCurrent: $('#btn-save-current'),

    terminalOutput: $('#terminal-output'),
    terminalInput: $('#terminal-input'),
    terminalRun: $('#terminal-run'),

    lessonContent: $('#lesson-content'),

    practiceInit: $('#practice-init'),
    practiceBranch: $('#practice-branch'),
    practiceConflict: $('#practice-conflict'),
  };

  // ---------- Renderers ----------
  function renderWorkingFiles() {
    const ul = dom.workingFiles;
    ul.innerHTML = '';
    const names = Object.keys(state.repo.working).sort();
    if (names.length === 0) {
      ul.innerHTML = '<li class="file-item"><span class="name">暂无文件</span></li>';
      return;
    }
    const headCommit = getHeadCommit();
    const headTree = headCommit ? headCommit.tree : {};

    names.forEach((name) => {
      const work = state.repo.working[name];
      const inIndex = Object.prototype.hasOwnProperty.call(state.repo.index, name);
      const headContent = headTree && headTree[name];
      const isTracked = work.tracked || Boolean(headContent);
      const isChanged = headContent !== undefined && work.content !== headContent;
      const isUntracked = !isTracked;

      const li = document.createElement('li');
      li.className = 'file-item';
      li.innerHTML = `
        <span class="name" data-name="${escapeHtml(name)}">${escapeHtml(name)}</span>
        <span class="tags">
          ${isChanged ? '<span class="tag changed">modified</span>' : ''}
          ${inIndex ? '<span class="tag staged">staged</span>' : ''}
          ${isUntracked ? '<span class="tag">untracked</span>' : ''}
          <button class="btn btn-mini" data-action="open" data-name="${escapeHtml(name)}">打开</button>
          <button class="btn btn-mini" data-action="stage" data-name="${escapeHtml(name)}">暂存</button>
          <button class="btn btn-mini btn-danger" data-action="delete" data-name="${escapeHtml(name)}">删除</button>
        </span>
      `;
      ul.appendChild(li);
    });
  }

  function renderStagingFiles() {
    const ul = dom.stagingFiles;
    ul.innerHTML = '';
    const names = Object.keys(state.repo.index).sort();
    if (names.length === 0) {
      ul.innerHTML = '<li class="file-item"><span class="name">暂无暂存文件</span></li>';
      return;
    }
    names.forEach((name) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      li.innerHTML = `
        <span class="name">${escapeHtml(name)}</span>
        <span class="tags">
          <span class="tag staged">staged</span>
          <button class="btn btn-mini" data-action="unstage" data-name="${escapeHtml(name)}">取消暂存</button>
        </span>
      `;
      ul.appendChild(li);
    });
  }

  function renderCommitHistory() {
    const ul = dom.commitHistory;
    ul.innerHTML = '';
    const head = getHeadCommitId();
    if (!head) {
      ul.innerHTML = '<li class="file-item"><span class="name">暂无提交</span></li>';
      renderBranchInfo();
      return;
    }
    const list = [];
    let cur = head;
    while (cur) {
      const c = state.repo.commits[cur];
      list.push(c);
      cur = c.parents && c.parents[0];
    }
    list.forEach((c) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      li.innerHTML = `
        <span class="name">${shortId(c.id)} ${escapeHtml(c.message)}</span>
        <span class="tags">
          <span class="tag">${escapeHtml(formatDate(c.timestamp))}</span>
        </span>
      `;
      ul.appendChild(li);
    });
    renderBranchInfo();
  }

  function renderBranchInfo() {
    const box = dom.branchInfo;
    if (!state.repo.initialized) {
      box.textContent = '仓库未初始化';
      return;
    }
    const items = Object.keys(state.repo.branches).sort();
    const current = state.repo.headBranch || '';
    const remoteUrl = state.repo.remote.url || '未设置远程';
    const html = `
      <div>分支：
        ${items
          .map((b) => (b === current ? `<strong>* ${escapeHtml(b)}</strong>` : escapeHtml(b)))
          .join(' | ')}
      </div>
      <div>远程：${escapeHtml(remoteUrl)}</div>
    `;
    box.innerHTML = html;
  }

  function renderEditor() {
    const file = state.ui.selectedFile;
    if (!file) {
      dom.editorFilename.textContent = '未选择文件';
      dom.editorContent.value = '';
      dom.editorContent.disabled = true;
      return;
    }
    dom.editorFilename.textContent = file;
    dom.editorContent.disabled = false;
    dom.editorContent.value = state.repo.working[file]?.content ?? '';
    state.ui.editorDirty = false;
  }

  function appendTerminal(text) {
    dom.terminalOutput.textContent += text + '\n';
    dom.terminalOutput.scrollTop = dom.terminalOutput.scrollHeight;
  }

  function setTerminal(text) {
    dom.terminalOutput.textContent = text ? text + '\n' : '';
  }

  function clearTerminal() {
    dom.terminalOutput.textContent = '';
  }

  function updateAll() {
    renderWorkingFiles();
    renderStagingFiles();
    renderCommitHistory();
    renderEditor();
  }

  // ---------- Git Core Helpers ----------
  function getHeadCommitId() {
    const branch = state.repo.headBranch;
    if (!branch) return null;
    return state.repo.branches[branch] || null;
  }

  function getHeadCommit() {
    const id = getHeadCommitId();
    if (!id) return null;
    return state.repo.commits[id] || null;
  }

  function getHeadTree() {
    const c = getHeadCommit();
    return c ? c.tree : {};
  }

  function computeStatus() {
    const headTree = getHeadTree();
    const workingNames = Object.keys(state.repo.working);
    const stagedNames = Object.keys(state.repo.index);

    const staged = [];
    const modified = [];
    const untracked = [];

    // staged
    for (const name of stagedNames) {
      const stagedContent = state.repo.index[name];
      const headContent = headTree[name];
      if (stagedContent !== headContent) {
        staged.push(name);
      }
    }

    // modified or untracked
    for (const name of workingNames) {
      const workContent = state.repo.working[name].content;
      const headContent = headTree[name];
      const inIndex = Object.prototype.hasOwnProperty.call(state.repo.index, name);
      if (headContent === undefined && !inIndex) {
        untracked.push(name);
      } else if (headContent !== undefined && workContent !== headContent && !inIndex) {
        modified.push(name);
      }
    }

    return { staged, modified, untracked };
  }

  function writeCommit(message, isMergeParents) {
    const parents = Array.isArray(isMergeParents) ? isMergeParents : [];
    const newTree = deepClone(getHeadTree());
    for (const [name, content] of Object.entries(state.repo.index)) {
      if (content === null) {
        delete newTree[name];
      } else {
        newTree[name] = content;
      }
    }
    const id = generateCommitId(++state.repo.historyCounter);
    const commit = {
      id,
      message,
      parents: parents.length ? parents : (getHeadCommitId() ? [getHeadCommitId()] : []),
      tree: newTree,
      author: {
        name: state.config.userName || 'unknown',
        email: state.config.userEmail || 'unknown@example.com',
      },
      timestamp: Date.now(),
    };
    state.repo.commits[id] = commit;
    // advance branch
    state.repo.branches[state.repo.headBranch] = id;
    // mark working tracked
    for (const name of Object.keys(state.repo.working)) {
      if (newTree[name] !== undefined) {
        state.repo.working[name].tracked = true;
      }
    }
    // clear index
    state.repo.index = {};
    return commit;
  }

  function ensureRepoInitialized() {
    if (!state.repo.initialized) {
      throw new Error('仓库未初始化，请先执行：git init');
    }
  }

  function ensureIdentityConfigured() {
    if (!state.config.userName || !state.config.userEmail) {
      throw new Error('请先配置用户名与邮箱：git config user.name "你的名字" 与 git config user.email "你的邮箱"');
    }
  }

  function resetWorkingToTree(tree) {
    state.repo.working = {};
    for (const [name, content] of Object.entries(tree || {})) {
      state.repo.working[name] = { content, tracked: true };
    }
  }

  function findCommonAncestor(commitA, commitB) {
    // naive: walk A's parents linearly and return first found in B's linear ancestry
    const seen = new Set();
    let cur = commitA;
    while (cur) {
      seen.add(cur.id);
      cur = cur.parents && cur.parents[0] ? state.repo.commits[cur.parents[0]] : null;
    }
    cur = commitB;
    while (cur) {
      if (seen.has(cur.id)) return cur;
      cur = cur.parents && cur.parents[0] ? state.repo.commits[cur.parents[0]] : null;
    }
    return null;
  }

  function attemptAutoMerge(baseTree, currentTree, otherTree) {
    const resultTree = deepClone(currentTree);
    const conflicts = [];
    const fileNames = new Set([
      ...Object.keys(baseTree || {}),
      ...Object.keys(currentTree || {}),
      ...Object.keys(otherTree || {}),
    ]);

    for (const name of fileNames) {
      const base = (baseTree || {})[name];
      const ours = (currentTree || {})[name];
      const theirs = (otherTree || {})[name];
      if (theirs === undefined && ours !== undefined) continue; // they deleted? keep ours
      if (ours === undefined && theirs !== undefined) {
        // we deleted but they have; prefer merge add
        resultTree[name] = theirs;
        continue;
      }
      if (ours === theirs) continue; // no change
      if (base === ours) {
        // fast-forward our file to theirs
        resultTree[name] = theirs;
        continue;
      }
      if (base === theirs) {
        // they didn't change; keep ours
        resultTree[name] = ours;
        continue;
      }
      // conflict
      const conflictContent = `<<<<<<< HEAD\n${ours ?? ''}\n=======\n${theirs ?? ''}\n>>>>>>> MERGE\n`;
      resultTree[name] = conflictContent;
      conflicts.push(name);
    }
    return { resultTree, conflicts };
  }

  // ---------- Terminal Command Handlers ----------
  const commands = {
    help() {
      return `支持的命令：\n\n` +
        [
          'git config user.name "你的名字"',
          'git config user.email "你的邮箱"',
          'git init',
          'git status',
          'git add <文件...> | git add .',
          'git commit -m "提交信息"',
          'git log --oneline',
          'git branch [分支名]',
          'git checkout <分支> | git checkout -b <分支>',
          'git merge <分支>',
          'git remote add origin <url>',
          'git push [-u] origin <分支>',
          'git pull',
          'clear',
        ].join('\n');
    },

    clear() {
      clearTerminal();
      return '';
    },

    'git'(args) {
      const sub = args[0];
      if (!sub) throw new Error('缺少子命令');
      switch (sub) {
        case 'config':
          return cmdConfig(args.slice(1));
        case 'init':
          return cmdInit();
        case 'status':
          return cmdStatus();
        case 'add':
          return cmdAdd(args.slice(1));
        case 'commit':
          return cmdCommit(args.slice(1));
        case 'log':
          return cmdLog(args.slice(1));
        case 'branch':
          return cmdBranch(args.slice(1));
        case 'checkout':
          return cmdCheckout(args.slice(1));
        case 'merge':
          return cmdMerge(args.slice(1));
        case 'remote':
          return cmdRemote(args.slice(1));
        case 'push':
          return cmdPush(args.slice(1));
        case 'pull':
          return cmdPull(args.slice(1));
        default:
          throw new Error(`未知的 git 子命令：${sub}`);
      }
    },
  };

  function cmdConfig(rest) {
    const key = rest[0];
    const value = rest.slice(1).join(' ').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (key === 'user.name') {
      state.config.userName = value;
      return `已设置 user.name = ${value}`;
    }
    if (key === 'user.email') {
      state.config.userEmail = value;
      return `已设置 user.email = ${value}`;
    }
    throw new Error('仅支持设置 user.name 与 user.email');
  }

  function cmdInit() {
    if (state.repo.initialized) return '仓库已初始化';
    state.repo.initialized = true;
    state.repo.headBranch = 'main';
    state.repo.branches['main'] = null;
    return '已在当前目录初始化空的 Git 仓库（默认分支 main）';
  }

  function cmdStatus() {
    ensureRepoInitialized();
    const branch = state.repo.headBranch;
    const { staged, modified, untracked } = computeStatus();
    let out = `On branch ${branch}\n`;
    if (!getHeadCommitId()) out += '\nNo commits yet\n';
    if (staged.length) {
      out += '\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n';
      for (const f of staged) out += `\n\tnew/modified: ${f}`;
      out += '\n';
    }
    if (modified.length) {
      out += '\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n';
      for (const f of modified) out += `\n\tmodified: ${f}`;
      out += '\n';
    }
    if (untracked.length) {
      out += '\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n';
      for (const f of untracked) out += `\n\t${f}`;
      out += '\n';
    }
    if (!staged.length && !modified.length && !untracked.length) {
      out += '\nnothing to commit, working tree clean\n';
    }
    return out.trim();
  }

  function cmdAdd(files) {
    ensureRepoInitialized();
    if (!files.length) throw new Error('请指定文件，如：git add readme.txt 或 git add .');
    const doAll = files.length === 1 && files[0] === '.';
    if (doAll) {
      for (const [name, file] of Object.entries(state.repo.working)) {
        state.repo.index[name] = file.content;
      }
      updateAll();
      return '已暂存当前工作区的全部文件';
    }
    const added = [];
    for (const name of files) {
      if (!state.repo.working[name]) throw new Error(`文件不存在：${name}`);
      state.repo.index[name] = state.repo.working[name].content;
      added.push(name);
    }
    updateAll();
    return `已暂存：${added.join(', ')}`;
  }

  function cmdCommit(args) {
    ensureRepoInitialized();
    ensureIdentityConfigured();
    const msgIndex = args.findIndex((a) => a === '-m');
    if (msgIndex === -1) throw new Error('请使用 -m "提交信息"');
    const message = args.slice(msgIndex + 1).join(' ').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (!message) throw new Error('提交信息不能为空');
    if (Object.keys(state.repo.index).length === 0) throw new Error('没有暂存的更改，无法提交');
    const commit = writeCommit(message);
    updateAll();
    return `提交完成：${shortId(commit.id)} ${message}`;
  }

  function cmdLog(args) {
    ensureRepoInitialized();
    const oneline = args.includes('--oneline');
    const head = getHeadCommitId();
    if (!head) return '暂无提交';
    const logs = [];
    let cur = head;
    while (cur) {
      const c = state.repo.commits[cur];
      if (oneline) logs.push(`${shortId(c.id)} ${c.message}`);
      else logs.push(`commit ${c.id}\nAuthor: ${c.author.name} <${c.author.email}>\nDate:   ${formatDate(c.timestamp)}\n\n    ${c.message}\n`);
      cur = c.parents && c.parents[0];
    }
    return logs.join('\n');
  }

  function cmdBranch(args) {
    ensureRepoInitialized();
    if (!args.length) {
      const items = Object.keys(state.repo.branches).sort();
      return items.map((b) => (b === state.repo.headBranch ? `* ${b}` : `  ${b}`)).join('\n');
    }
    const name = args[0];
    if (state.repo.branches[name] !== undefined) throw new Error(`分支已存在：${name}`);
    state.repo.branches[name] = getHeadCommitId();
    updateAll();
    return `已创建分支 ${name}`;
  }

  function cmdCheckout(args) {
    ensureRepoInitialized();
    if (args[0] === '-b') {
      const name = args[1];
      if (!name) throw new Error('缺少分支名');
      if (state.repo.branches[name] !== undefined) throw new Error(`分支已存在：${name}`);
      state.repo.branches[name] = getHeadCommitId();
      state.repo.headBranch = name;
      state.repo.index = {};
      resetWorkingToTree(getHeadTree());
      updateAll();
      return `已创建并切换到分支 ${name}`;
    }
    const name = args[0];
    if (!name) throw new Error('缺少分支名');
    if (state.repo.branches[name] === undefined) throw new Error(`分支不存在：${name}`);
    state.repo.headBranch = name;
    state.repo.index = {};
    resetWorkingToTree(getHeadTree());
    updateAll();
    return `已切换到分支 ${name}`;
  }

  function cmdMerge(args) {
    ensureRepoInitialized();
    const name = args[0];
    if (!name) throw new Error('缺少要合并的分支名');
    if (state.repo.branches[name] === undefined) throw new Error(`分支不存在：${name}`);
    const currentHead = getHeadCommit();
    const otherHeadId = state.repo.branches[name];
    if (!otherHeadId) return '目标分支没有提交，已是最新';
    const otherHead = state.repo.commits[otherHeadId];
    if (!currentHead) {
      // fast-forward
      state.repo.branches[state.repo.headBranch] = otherHeadId;
      resetWorkingToTree(otherHead.tree);
      updateAll();
      return `Fast-forward 合并完成`;
    }
    if (otherHeadId === getHeadCommitId()) {
      return 'Already up to date.';
    }
    const base = findCommonAncestor(currentHead, otherHead) || { tree: {} };
    const { resultTree, conflicts } = attemptAutoMerge(base.tree, currentHead.tree, otherHead.tree);
    if (conflicts.length) {
      // write conflict files to working and stage nothing
      resetWorkingToTree(resultTree);
      state.repo.index = {};
      updateAll();
      return `合并产生冲突，请编辑并解决后：git add . && git commit -m "merge ${name}"\n冲突文件：\n- ${conflicts.join('\n- ')}`;
    }
    // no conflicts -> auto commit merge
    state.repo.index = resultTree; // stage whole tree snapshot
    const commit = writeCommit(`Merge branch '${name}'`, [getHeadCommitId(), otherHeadId]);
    resetWorkingToTree(commit.tree);
    updateAll();
    return `合并完成：${shortId(commit.id)} ${commit.message}`;
  }

  function cmdRemote(args) {
    const sub = args[0];
    if (sub !== 'add') throw new Error('仅支持：git remote add origin <url>');
    const name = args[1];
    const url = args[2];
    if (name !== 'origin') throw new Error('仅支持远程名 origin');
    if (!url) throw new Error('缺少远程地址');
    state.repo.remote.url = url;
    return `已添加远程 origin -> ${url}`;
  }

  function cmdPush(args) {
    ensureRepoInitialized();
    if (!state.repo.remote.url) throw new Error('未设置远程，请先：git remote add origin <url>');
    const hasU = args.includes('-u');
    const orgIdx = args.indexOf('origin');
    const branch = orgIdx >= 0 ? args[orgIdx + 1] : state.repo.headBranch;
    if (!branch) throw new Error('缺少分支名');
    state.repo.remote.branches[branch] = getHeadCommitId();
    return hasU ? `分支 ${branch} 已推送并设置上游` : `分支 ${branch} 已推送`;
  }

  function cmdPull() {
    ensureRepoInitialized();
    if (!state.repo.remote.url) throw new Error('未设置远程');
    const branch = state.repo.headBranch;
    const remoteHeadId = state.repo.remote.branches[branch];
    if (!remoteHeadId) return '远程无对应分支';
    const localHeadId = getHeadCommitId();
    if (!localHeadId) {
      // fast-forward to remote
      state.repo.branches[branch] = remoteHeadId;
      resetWorkingToTree(state.repo.commits[remoteHeadId].tree);
      updateAll();
      return '已拉取（fast-forward）';
    }
    if (remoteHeadId === localHeadId) return 'Already up to date.';
    const localHead = state.repo.commits[localHeadId];
    const remoteHead = state.repo.commits[remoteHeadId];
    const base = findCommonAncestor(localHead, remoteHead) || { tree: {} };
    const { resultTree, conflicts } = attemptAutoMerge(base.tree, localHead.tree, remoteHead.tree);
    if (conflicts.length) {
      resetWorkingToTree(resultTree);
      state.repo.index = {};
      updateAll();
      return `拉取产生冲突，请解决后提交`; 
    }
    // auto merge commit
    state.repo.index = resultTree;
    const commit = writeCommit(`Merge remote '${branch}'`, [localHeadId, remoteHeadId]);
    resetWorkingToTree(commit.tree);
    updateAll();
    return '已拉取并合并';
  }

  // ---------- Terminal Parser ----------
  function runCommand(raw) {
    const input = raw.trim();
    if (!input) return;
    appendTerminal(`$ ${input}`);
    try {
      const tokens = tokenize(input);
      if (tokens.length === 0) return;
      const cmd = tokens[0];
      const args = tokens.slice(1);
      if (commands[cmd]) {
        const out = commands[cmd](args);
        if (out) appendTerminal(out);
      } else {
        throw new Error(`未知命令：${cmd}`);
      }
    } catch (err) {
      appendTerminal(String(err.message || err));
    }
  }

  function tokenize(s) {
    // simple tokenizer with quotes support
    const result = [];
    let cur = '';
    let quote = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quote) {
        if (ch === quote) {
          quote = null;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"' || ch === "'") {
          if (cur) {
            result.push(cur);
            cur = '';
          }
          quote = ch;
        } else if (ch === ' ') {
          if (cur) {
            result.push(cur);
            cur = '';
          }
        } else {
          cur += ch;
        }
      }
    }
    if (cur) result.push(cur);
    if (quote) throw new Error('引号未闭合');
    return result;
  }

  // ---------- Lessons & Practice ----------
  const steps = [
    {
      id: 1,
      title: '配置用户名与邮箱',
      content: `Git 会在提交中记录作者身份。请设置：\n\n- git config user.name "你的名字"\n- git config user.email "你的邮箱"`,
      examples: [
        'git config user.name "Alice"',
        'git config user.email "alice@example.com"',
      ],
      check: () => Boolean(state.config.userName && state.config.userEmail),
    },
    {
      id: 2,
      title: '初始化仓库与首次提交',
      content: `创建仓库，新增文件并完成第一条提交：\n\n- git init\n- 新建与编辑文件（左侧工作区）\n- git add .\n- git commit -m "first commit"`,
      examples: [
        'git init',
        'git add .',
        'git commit -m "first commit"',
      ],
      check: () => Boolean(getHeadCommitId()),
    },
    {
      id: 3,
      title: '查看状态与提交历史',
      content: `学会常用查看命令：\n\n- git status（工作区/暂存区）\n- git log --oneline（提交历史）`,
      examples: [
        'git status',
        'git log --oneline',
      ],
      check: () => true,
    },
    {
      id: 4,
      title: '分支创建、切换与合并',
      content: `体验分支工作流：\n\n- git checkout -b feature-x\n- 编辑并提交\n- git checkout main\n- git merge feature-x`,
      examples: [
        'git checkout -b feature-x',
        'git checkout main',
        'git merge feature-x',
      ],
      check: () => Object.keys(state.repo.branches).length > 1,
    },
    {
      id: 5,
      title: '连接远程与推拉代码',
      content: `模拟远程仓库：\n\n- git remote add origin https://example.com/repo.git\n- git push -u origin main\n- git pull`,
      examples: [
        'git remote add origin https://example.com/repo.git',
        'git push -u origin main',
      ],
      check: () => Boolean(state.repo.remote.url),
    },
    {
      id: 6,
      title: '练习：解决一次合并冲突',
      content: `我们将模拟双方同时修改同一文件，触发冲突。步骤：\n\n1) 在 main 上提交一个文件 file.txt 内容：A\n2) 新建分支 feature 修改 file.txt 为：B 并提交\n3) 回到 main 把 file.txt 改为：C 并提交\n4) 合并 feature：git merge feature\n5) 解决冲突（编辑 file.txt，保留你想要的内容），然后：git add . && git commit -m "resolve"`,
      examples: [
        'git checkout -b feature',
        'git checkout main',
        'git merge feature',
      ],
      check: () => {
        // if last commit message contains resolve or Merge branch 'feature'
        const head = getHeadCommit();
        if (!head) return false;
        const hasMarkers = Object.values(head.tree || {}).some((c) => /<<<<<<< HEAD/.test(String(c)));
        return !hasMarkers;
      },
    },
  ];

  let currentStepIdx = 0;

  function renderStepSidebar() {
    $$('#steps-list li').forEach((li, idx) => {
      if (idx === currentStepIdx) li.classList.add('active');
      else li.classList.remove('active');
    });
    const progress = ((currentStepIdx) / (steps.length - 1)) * 100;
    dom.progressBar.style.width = `${Math.max(0, Math.min(progress, 100)).toFixed(0)}%`;
  }

  function renderLesson() {
    const s = steps[currentStepIdx];
    dom.lessonContent.innerHTML = `
      <h3>${escapeHtml(s.title)}</h3>
      <p>${escapeHtml(s.content).replace(/\n/g, '<br/>')}</p>
      <div class="lesson-actions">
        ${s.examples
          .map((cmd) => `<button class="btn btn-secondary" data-example="${escapeHtml(cmd)}">一键填入：${escapeHtml(cmd)}</button>`)
          .join('')}
        <button class="btn" id="btn-check-step">检测完成</button>
        ${currentStepIdx < steps.length - 1 ? '<button class="btn" id="btn-next-step">下一步</button>' : ''}
      </div>
    `;
  }

  function attachLessonEvents() {
    dom.lessonContent.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const ex = t.getAttribute('data-example');
      if (ex) {
        dom.terminalInput.value = ex;
        dom.terminalInput.focus();
      }
      if (t.id === 'btn-check-step') {
        const ok = steps[currentStepIdx].check();
        appendTerminal(ok ? '✅ 本步骤已完成！' : '❌ 尚未完成，请按提示继续操作');
        if (ok && currentStepIdx < steps.length - 1) {
          currentStepIdx += 1;
          renderStepSidebar();
          renderLesson();
        }
      }
      if (t.id === 'btn-next-step') {
        currentStepIdx = Math.min(currentStepIdx + 1, steps.length - 1);
        renderStepSidebar();
        renderLesson();
      }
    });
  }

  // ---------- UI Event Handlers ----------
  function attachUIEvents() {
    // quick actions
    dom.btnReset.addEventListener('click', () => {
      resetAll();
      appendTerminal('模拟环境已重置');
    });
    dom.btnFillDemo.addEventListener('click', () => {
      fillDemoProject();
      appendTerminal('已填充示例项目：index.html, app.js, readme.md');
    });

    // file creation
    dom.btnCreateFile.addEventListener('click', () => {
      const name = (dom.newFileName.value || '').trim();
      if (!name) return;
      if (state.repo.working[name]) {
        appendTerminal('文件已存在');
        return;
      }
      state.repo.working[name] = { content: '', tracked: false };
      dom.newFileName.value = '';
      if (!state.ui.selectedFile) state.ui.selectedFile = name;
      updateAll();
    });

    // working files actions
    dom.workingFiles.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const action = t.getAttribute('data-action');
      const name = t.getAttribute('data-name');
      if (!action || !name) return;
      if (action === 'open') {
        state.ui.selectedFile = name;
        renderEditor();
      } else if (action === 'stage') {
        const file = state.repo.working[name];
        if (!file) return;
        state.repo.index[name] = file.content;
        updateAll();
      } else if (action === 'delete') {
        delete state.repo.working[name];
        delete state.repo.index[name];
        if (state.ui.selectedFile === name) state.ui.selectedFile = null;
        updateAll();
      }
    });

    // staging files actions
    dom.stagingFiles.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const action = t.getAttribute('data-action');
      const name = t.getAttribute('data-name');
      if (action === 'unstage' && name) {
        delete state.repo.index[name];
        updateAll();
      }
    });

    // editor
    dom.editorContent.addEventListener('input', () => {
      state.ui.editorDirty = true;
    });
    dom.btnSaveCurrent.addEventListener('click', () => {
      const file = state.ui.selectedFile;
      if (!file) return;
      const text = dom.editorContent.value ?? '';
      if (!state.repo.working[file]) state.repo.working[file] = { content: '', tracked: false };
      state.repo.working[file].content = text;
      state.ui.editorDirty = false;
      updateAll();
    });
    dom.btnDiscardCurrent.addEventListener('click', () => {
      renderEditor();
    });
    dom.btnStageCurrent.addEventListener('click', () => {
      const file = state.ui.selectedFile;
      if (!file) return;
      if (!state.repo.working[file]) return;
      state.repo.index[file] = state.repo.working[file].content;
      updateAll();
    });

    // terminal actions shortcuts
    $$('.terminal-actions .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (!cmd) return;
        if (cmd === 'clear') {
          runCommand('clear');
          return;
        }
        dom.terminalInput.value = cmd;
        dom.terminalInput.focus();
      });
    });

    dom.terminalRun.addEventListener('click', () => {
      const input = dom.terminalInput.value;
      runCommand(input);
      dom.terminalInput.value = '';
    });
    dom.terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        runCommand(dom.terminalInput.value);
        dom.terminalInput.value = '';
      }
    });

    // practice
    dom.practiceInit.addEventListener('click', () => {
      resetAll();
      runCommand('git init');
      state.repo.working['readme.md'] = { content: '# 项目介绍\n', tracked: false };
      state.ui.selectedFile = 'readme.md';
      updateAll();
      appendTerminal('练习：请将 readme.md 暂存并提交：git add . && git commit -m "init"');
    });

    dom.practiceBranch.addEventListener('click', () => {
      resetAll();
      runCommand('git init');
      state.repo.working['app.js'] = { content: 'console.log("v1");', tracked: false };
      runCommand('git add .');
      runCommand('git commit -m "v1"');
      runCommand('git checkout -b feature-ui');
      state.repo.working['app.js'].content = 'console.log("v2 on feature");';
      appendTerminal('练习：请提交 feature-ui 上的更改，然后回到 main 并合并');
      updateAll();
    });

    dom.practiceConflict.addEventListener('click', () => {
      resetAll();
      runCommand('git init');
      state.repo.working['file.txt'] = { content: 'A\n', tracked: false };
      runCommand('git add .');
      runCommand('git commit -m "A"');
      runCommand('git checkout -b feature');
      state.repo.working['file.txt'].content = 'B\n';
      runCommand('git add .');
      runCommand('git commit -m "B"');
      runCommand('git checkout main');
      state.repo.working['file.txt'].content = 'C\n';
      runCommand('git add .');
      runCommand('git commit -m "C"');
      appendTerminal('现在执行：git merge feature。将出现冲突，请在编辑器中解决后 add+commit');
      updateAll();
    });
  }

  // ---------- Setup Helpers ----------
  function resetAll() {
    state.config.userName = '';
    state.config.userEmail = '';
    state.repo.initialized = false;
    state.repo.branches = {};
    state.repo.headBranch = null;
    state.repo.commits = {};
    state.repo.index = {};
    state.repo.working = {};
    state.repo.remote = { url: null, branches: {} };
    state.repo.historyCounter = 0;
    state.ui.selectedFile = null;
    state.ui.editorDirty = false;
    setTerminal('');
    updateAll();
    currentStepIdx = 0;
    renderStepSidebar();
    renderLesson();
  }

  function fillDemoProject() {
    state.repo.working['index.html'] = { content: '<!DOCTYPE html>\n<html>\n<body>Hello</body>\n</html>\n', tracked: false };
    state.repo.working['app.js'] = { content: 'console.log("hello");\n', tracked: false };
    state.repo.working['readme.md'] = { content: '# Demo\n', tracked: false };
    if (!state.ui.selectedFile) state.ui.selectedFile = 'readme.md';
    updateAll();
  }

  // ---------- Init ----------
  function init() {
    renderWorkingFiles();
    renderStagingFiles();
    renderCommitHistory();
    renderEditor();
    renderStepSidebar();
    renderLesson();
    attachLessonEvents();
    attachUIEvents();
  }

  init();
})(); 