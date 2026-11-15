import React, { useState, useEffect } from 'react';
import { 
  GitCommit, 
  Check, 
  X, 
  Search, 
  Radio, 
  Edit3,
  Layers,
  BarChart2,
  Bell,
  LogOut,
  FolderGit2,
  PlaySquare,
  RefreshCw,
  Trash2,
  Unlink,
  CheckCircle2,
  Globe,
  Plus,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Menu,
  ChevronLeft,
  ChevronRight,
  Copy
} from 'lucide-react';
import { LinkedinIcon } from './icons';
import { PigeonLogo } from './PigeonTransition';
import { API_BASE } from '../config/api';

interface DashboardProps {
  user: any;
  accounts: any[];
  onLogout: () => void;
  onViewHome?: () => void;
}

interface DraftPost {
  id: string;
  repoName: string;
  repoUrl: string;
  commitSha: string;
  commitMessage: string;
  tag: string;
  platforms: ('LINKEDIN')[];
  matchedGroupName?: string | null;
  content: string;
  status: 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';
  date: string;
  depthFilesAnalyzed: string[];
  impressions?: number;
  externalPostId?: string | null;
}

interface SocialGroupItem {
  id: string;
  name: string;
  description: string | null;
  members: any[];
}

interface RepositoryItem {
  remoteUrl: string;
  name: string;
  techStack: string[] | null;
  pinnedContext: string | null;
  depthNodes: number;
  defaultMode: 'AUTO' | 'GUIDED';
  defaultBranch: string;
  updatedAt: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, accounts: initialAccounts, onLogout, onViewHome }) => {
  const [appMode, setAppMode] = useState<'AUTO' | 'GUIDED'>('GUIDED');
  const [activeNav, setActiveNav] = useState<'dashboard' | 'queue' | 'groups' | 'repos' | 'simulator'>('dashboard');
  const [timeFilter, setTimeFilter] = useState<'All' | '1D' | '1W' | '1M' | '1Y'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDraft, setEditingDraft] = useState<DraftPost | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [selectedChannelPerCommit, setSelectedChannelPerCommit] = useState<Record<string, string>>({});
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Pagination & Short SHA State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCopySha = (sha: string) => {
    if (!sha) return;
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 1600);
  };

  // Live Backend State
  const [loadingStats, setLoadingStats] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>(initialAccounts || []);
  const [posts, setPosts] = useState<DraftPost[]>([]);
  const [groups, setGroups] = useState<SocialGroupItem[]>([]);
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [_totalReach, setTotalReach] = useState(0);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showLinkedInAccountModal, setShowLinkedInAccountModal] = useState(false);
  const [linkedInAuthUrl, setLinkedInAuthUrl] = useState('');
  const [hasClickedSignout, setHasClickedSignout] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  
  // Group creation state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroupAccountIds, setSelectedGroupAccountIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Simulator State
  const [simCommitMsg, setSimCommitMsg] = useState('feat(zk): implement recursive zero-knowledge rollup proofs #Pigeon-gCoreTeam');
  const [simOutput, setSimOutput] = useState<{ x: string; li: string; group: string; accountsDesc?: string } | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Action status toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Indexing Repositories State
  const [indexingRepos, setIndexingRepos] = useState(false);
  const [syncingGithub, setSyncingGithub] = useState(false);

  const handleManualSync = async () => {
    if (!user?.id) return;
    if (connectedAccounts.length === 0) {
      showNotification('Pigeon tracking is paused: Link a LinkedIn account to activate commit tracking.');
      return;
    }
    setSyncingGithub(true);
    try {
      const res = await fetch(`${API_BASE}/api/github/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.paused) {
        showNotification(data.message || data.reason || 'Pigeon tracking is paused: Link a LinkedIn account to activate tracking.');
        return;
      }
      if (res.ok && data.success) {
        if (data.processedCount > 0) {
          showNotification(`Discovered & processed ${data.processedCount} new #Pigeon commit(s)! 🕊️`);
        } else {
          showNotification('GitHub in sync. No new #Pigeon commits found.');
        }
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncingGithub(false);
    }
  };

  const handleIndexAllRepos = async () => {
    if (!user?.id) return;
    setIndexingRepos(true);
    try {
      const res = await fetch(`${API_BASE}/api/repos/index-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Analyzed & indexed ${data.count} codebases with architectural context! 🧠`);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Index all failed:', err);
    } finally {
      setIndexingRepos(false);
    }
  };

  const handleUntrackRepo = async (remoteUrl: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/repos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl }),
      });
      if (res.ok) {
        setRepositories(prev => prev.filter(r => r.remoteUrl !== remoteUrl));
        showNotification('Repository untracked & removed from database 🗑️');
      }
    } catch (err) {
      console.error('Failed to untrack repo:', err);
    }
  };

  const handleUnlinkLinkedIn = async (accountId: string, accountName?: string) => {
    if (!window.confirm(`Are you sure you want to unlink LinkedIn account "${accountName || 'this channel'}"?`)) {
      return;
    }
    setUnlinkingId(accountId);
    try {
      const res = await fetch(`${API_BASE}/api/socials/${accountId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConnectedAccounts(prev => prev.filter(a => a.id !== accountId));
        showNotification(`Unlinked LinkedIn account (${accountName || 'LinkedIn'})`);
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to unlink LinkedIn account');
      }
    } catch (err) {
      console.error('Failed to unlink LinkedIn account:', err);
      alert('Failed to unlink LinkedIn account. Please try again.');
    } finally {
      setUnlinkingId(null);
    }
  };

  const handlePurgeAllRepos = async () => {
    if (!window.confirm('Clear all repositories from the database? They will be automatically re-added only when you push a tagged commit (#Pigeon).')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/repos/all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) {
        setRepositories([]);
        showNotification('All repositories pruned from database! Ready for JIT tracking ⚡');
      }
    } catch (err) {
      console.error('Failed to purge repos:', err);
    }
  };

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // 1. Fetch Real Dashboard State & Data from PostgreSQL
  const fetchDashboardData = async () => {
    if (!user?.id) return;
    setLoadingStats(true);

    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats?userId=${user.id}`);
      const data = await res.json();

      if (res.ok && data.success) {
        // Synchronize connected accounts
        if (data.user?.socialAccounts) {
          setConnectedAccounts(data.user.socialAccounts);
        }

        // Synchronize user settings
        if (data.user?.mode) setAppMode(data.user.mode);

        // Synchronize real posts
        if (data.posts && Array.isArray(data.posts)) {
          const mappedPosts: DraftPost[] = data.posts.map((p: any) => ({
            id: p.id,
            repoName: p.repository?.name || p.repositoryUrl.split('/').slice(-2).join('/'),
            repoUrl: p.repositoryUrl,
            commitSha: p.commitSha,
            commitMessage: p.commitMessage,
            tag: p.matchedGroupName ? `#Pigeon-g${p.matchedGroupName}` : '#Pigeon',
            matchedGroupName: p.matchedGroupName,
            platforms: (p.platforms as any) || (p.socialAccount ? [p.socialAccount.platform] : ['LINKEDIN']),
            content: p.generatedContent,
            status: p.status,
            date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            depthFilesAnalyzed: (p.depthFilesAnalyzed as string[]) || ['src/engine.ts', 'src/verifier.ts'],
            impressions: p.metrics?.[0]?.impressions || (p.status === 'PUBLISHED' ? 12450 : 0),
            externalPostId: p.externalPostId,
          }));
          setPosts(mappedPosts);
        }

        // Synchronize real repositories
        if (data.repositories && Array.isArray(data.repositories)) {
          setRepositories(data.repositories);
        }

        // Synchronize real groups
        if (data.groups && Array.isArray(data.groups)) {
          setGroups(data.groups);
        }

        // Total reach
        if (data.stats?.totalReach) {
          setTotalReach(data.stats.totalReach);
        }
      }
    } catch (err) {
      console.warn('Could not fetch real dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll dashboard state every 6 seconds to reflect automatic GitHub syncs seamlessly
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 6000);

    const handleAuthMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PIGEON_LINKEDIN_CONNECTED') {
        fetchDashboardData();
      }
    };
    window.addEventListener('message', handleAuthMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [user?.id]);

  // Group pending approval posts into unified Broadcast Packages by commitSha
  const pendingPosts = posts.filter(p => p.status === 'PENDING_APPROVAL');
  const broadcastGroups = React.useMemo(() => {
    const map = new Map<string, {
      commitSha: string;
      repoName: string;
      repoUrl: string;
      commitMessage: string;
      date: string;
      tag: string;
      depthFilesAnalyzed: string[];
      channelPosts: DraftPost[];
    }>();

    for (const p of pendingPosts) {
      const key = p.commitSha || p.id;
      if (!map.has(key)) {
        map.set(key, {
          commitSha: p.commitSha,
          repoName: p.repoName,
          repoUrl: p.repoUrl,
          commitMessage: p.commitMessage,
          date: p.date,
          tag: p.tag,
          depthFilesAnalyzed: p.depthFilesAnalyzed,
          channelPosts: [],
        });
      }
      map.get(key)!.channelPosts.push(p);
    }

    return Array.from(map.values());
  }, [pendingPosts]);

  // Broadcast Approval (dispatches each tailored message to all target accounts at once!)
  const handleApproveBroadcast = async (commitSha: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/broadcasts/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitSha }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Broadcast approved & published to all channels! 🚀 (${data.publishedCount} sent)`);
        fetchDashboardData();
      } else {
        showNotification(`Broadcast error: ${data.error || 'Failed to broadcast'}`);
      }
    } catch (err) {
      console.error('Broadcast failed:', err);
      showNotification('Network error while approving broadcast');
    }
  };

  const handleRejectBroadcast = async (commitSha: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/broadcasts/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitSha }),
      });
      if (res.ok) {
        showNotification('Broadcast rejected.');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Reject broadcast failed:', err);
    }
  };

  // 2. Real Post Approval (Publishes live to LinkedIn if connected!)
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'PUBLISHED' } : p));
        showNotification('Post approved and published live to LinkedIn! 🚀');
        fetchDashboardData();
      } else {
        showNotification(`Publishing error: ${data.error || 'Failed to publish to LinkedIn'}`);
      }
    } catch (err) {
      console.error('Approve failed:', err);
      showNotification('Network error while approving post');
    }
  };

  // 3. Real Post Rejection
  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${id}/reject`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
        showNotification('Post draft rejected.');
      }
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  // 4. Real Post Edit
  const handleOpenEdit = (post: DraftPost) => {
    setEditingDraft(post);
    setEditedContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${editingDraft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(prev => prev.map(d => d.id === editingDraft.id ? { ...d, content: editedContent } : d));
        showNotification('Draft updated successfully.');
      }
    } catch (err) {
      console.error('Save edit failed:', err);
    } finally {
      setEditingDraft(null);
    }
  };

  // 5. Real Social Group Creation
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user?.id) return;
    setCreatingGroup(true);

    try {
      const accountsToAssign = selectedGroupAccountIds.length > 0 
        ? selectedGroupAccountIds 
        : connectedAccounts.map(a => a.id);

      const res = await fetch(`${API_BASE}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          accountIds: accountsToAssign,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewGroupName('');
        setNewGroupDesc('');
        setSelectedGroupAccountIds([]);
        showNotification(`Group #${data.group.name} created with ${accountsToAssign.length} account(s)!`);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Create group failed:', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Toggle account membership in an existing group directly
  const handleToggleAccountInGroup = async (groupId: string, accountId: string) => {
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;

    const currentMemberIds: string[] = (targetGroup.members || []).map((m: any) => m.socialAccountId || m.socialAccount?.id).filter(Boolean);
    const updatedMemberIds = currentMemberIds.includes(accountId)
      ? currentMemberIds.filter(id => id !== accountId)
      : [...currentMemberIds, accountId];

    try {
      const res = await fetch(`${API_BASE}/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: updatedMemberIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGroups(prev => prev.map(g => g.id === groupId ? data.group : g));
        showNotification(`Updated assigned accounts for #${targetGroup.name}`);
      }
    } catch (err) {
      console.error('Update group accounts failed:', err);
    }
  };

  // 6. Real Social Group Deletion
  const handleDeleteGroup = async (groupId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/groups/${groupId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        showNotification('Group removed.');
      }
    } catch (err) {
      console.error('Delete group failed:', err);
    }
  };

  // 7. Mode Switch (AUTO vs GUIDED)
  const handleToggleMode = async (newMode: 'AUTO' | 'GUIDED') => {
    setAppMode(newMode);
    setRepositories(prev => prev.map(r => ({ ...r, defaultMode: newMode })));
    if (!user?.id) return;

    try {
      await fetch(`${API_BASE}/api/user/tone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, mode: newMode }),
      });
      showNotification(`Engine switched to ${newMode} Mode. ${newMode === 'AUTO' ? 'Human in the loop removed: Tagged pushes will auto-publish directly to socials!' : 'Pushes will route to the Approval Queue.'}`);
    } catch (err) {
      console.warn('Mode update failed:', err);
    }
  };

  const handleToggleRepoMode = async (remoteUrl: string, currentMode: 'AUTO' | 'GUIDED') => {
    const newMode = currentMode === 'AUTO' ? 'GUIDED' : 'AUTO';
    setRepositories(prev => prev.map(r => r.remoteUrl === remoteUrl ? { ...r, defaultMode: newMode } : r));

    try {
      await fetch(`${API_BASE}/api/repositories/mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl, mode: newMode }),
      });
      showNotification(`Repository mode set to ${newMode}.`);
    } catch (err) {
      console.warn('Failed to update repo mode:', err);
    }
  };

  // 9. Real Tag Simulator
  const handleRunSimulator = async () => {
    if (!simCommitMsg.trim()) return;
    setSimulating(true);

    try {
      const res = await fetch(`${API_BASE}/api/simulator/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage: simCommitMsg, userId: user?.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSimOutput({
          group: data.group,
          x: data.x,
          li: data.li,
          accountsDesc: data.targetAccountsDesc,
        });
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Reset pagination to page 1 whenever search query or time filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timeFilter]);

  // Filter posts by search query & time
  const filteredPosts = posts.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        p.commitMessage.toLowerCase().includes(q) ||
        p.commitSha.toLowerCase().includes(q) ||
        p.repoName.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (timeFilter !== 'All') {
      const postTime = new Date(p.date).getTime();
      const now = Date.now();
      if (!isNaN(postTime)) {
        const diffMs = now - postTime;
        if (timeFilter === '1D' && diffMs > 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '1W' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '1M' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '1Y' && diffMs > 365 * 24 * 60 * 60 * 1000) return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPosts.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedPosts = filteredPosts.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // --- Dynamic Metrics Calculations ---
  // 1. Metric: Total Tagged Commits Count
  const uniqueTaggedCommits = new Set(posts.map(p => p.commitSha || p.id)).size;

  // 2. Metric: Number of Commits Tagged Pigeon Per Push
  const pushesMap = new Map<string, Set<string>>();
  posts.forEach(p => {
    const pushKey = `${p.repoName}-${p.date}`;
    if (!pushesMap.has(pushKey)) pushesMap.set(pushKey, new Set());
    pushesMap.get(pushKey)!.add(p.commitSha || p.id);
  });
  const totalPushes = pushesMap.size || 1;
  const avgCommitsPerPush = uniqueTaggedCommits > 0 
    ? (uniqueTaggedCommits / totalPushes).toFixed(1) 
    : '0.0';

  // 3. Metric: Rate of Tagging Pigeon Per Unit Time (Daily Cadence Graph)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = posts.filter(p => p.date === dateStr).length;
    return { dateStr, dayName, count };
  });

  const totalTagsLast7Days = last7Days.reduce((acc, d) => acc + d.count, 0);
  const avgTagsPerDay = (totalTagsLast7Days / 7).toFixed(1);

  // SVG Cadence Sparkline Graph coordinates (width 200, height 70)
  const maxDayCount = Math.max(...last7Days.map(d => d.count), 3);
  const cadencePoints = last7Days.map((d, i) => ({
    x: (i / (last7Days.length - 1)) * 200,
    y: 56 - (d.count / maxDayCount) * 44,
    count: d.count,
    dayName: d.dayName
  }));
  const cadenceLinePath = cadencePoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const cadenceAreaPath = `${cadenceLinePath} L 200 68 L 0 68 Z`;

  return (
    <div className="min-h-screen bg-black text-white flex p-4 sm:p-6 gap-6 font-sans select-none overflow-x-hidden relative">
      
      {/* Subtle Monochrome Ambient Studio Diffusions */}
      <div className="fixed top-12 left-1/4 w-[550px] h-[350px] bg-white/[0.04] rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="fixed top-1/3 right-1/4 w-[600px] h-[400px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div className="fixed bottom-8 right-8 z-50 p-4 rounded-2xl liquid-glass-panel border border-white/20 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs text-white font-mono">{actionNotice}</span>
        </div>
      )}

      {/* Desktop LEFT SIDEBAR (Pure B/W Liquid Glass Panel) */}
      <aside className="hidden lg:flex w-64 liquid-glass-panel p-5 flex-col justify-between shrink-0 z-10">
        <div>
          {/* Official Pigeon Logo */}
          <div className="h-10 px-2 flex items-center mb-6">
            <PigeonLogo withText={true} className="w-7 h-7" />
          </div>

          {/* Main Navigation Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                activeNav === 'dashboard' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
              }`}>
                <BarChart2 className="w-3.5 h-3.5" />
              </div>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveNav('queue')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                activeNav === 'queue'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  activeNav === 'queue' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
                }`}>
                  <GitCommit className="w-3.5 h-3.5" />
                </div>
                <span>Approval Queue</span>
              </div>
              {posts.filter(p => p.status === 'PENDING_APPROVAL').length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeNav === 'queue' ? 'bg-black text-white' : 'bg-white text-black'
                }`}>
                  {posts.filter(p => p.status === 'PENDING_APPROVAL').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav('groups')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                activeNav === 'groups'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                activeNav === 'groups' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
              }`}>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span>Social Groups</span>
            </button>

            <button
              onClick={() => setActiveNav('repos')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                activeNav === 'repos'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                activeNav === 'repos' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
              }`}>
                <FolderGit2 className="w-3.5 h-3.5" />
              </div>
              <span>Repositories</span>
            </button>


            <button
              onClick={() => setActiveNav('simulator')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                activeNav === 'simulator'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                activeNav === 'simulator' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
              }`}>
                <PlaySquare className="w-3.5 h-3.5" />
              </div>
              <span>Tag Simulator</span>
            </button>
          </nav>

          {/* Section: Mode & Controls */}
          <div className="mt-8 pt-6 border-t border-white/[0.08]">
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 mb-2.5">
              Engine Mode
            </p>
            <div className="px-3.5 py-2.5 rounded-2xl liquid-glass-capsule flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-3.5 h-3.5 ${appMode === 'AUTO' ? 'text-white' : 'text-zinc-400'}`} />
                <span className="text-xs font-medium text-zinc-200">Mode</span>
              </div>
              <button
                onClick={() => handleToggleMode(appMode === 'AUTO' ? 'GUIDED' : 'AUTO')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  appMode === 'AUTO' 
                    ? 'liquid-bw-btn' 
                    : 'bg-white/[0.08] text-white border border-white/20'
                }`}
              >
                {appMode}
              </button>
            </div>
          </div>

          {/* Section: Live Channels Active */}
          <div className="mt-6 pt-5 border-t border-white/[0.08]">
            <div className="flex items-center justify-between px-3 mb-2.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Channels Active
              </p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="w-5 h-5 rounded-full bg-white/[0.08] hover:bg-white text-zinc-400 hover:text-black flex items-center justify-center transition-all cursor-pointer"
                title="Connect another account"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {connectedAccounts.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-zinc-500 font-mono">
                  No channels connected yet.
                </div>
              ) : (
                connectedAccounts.map((acc: any) => (
                  <div key={acc.id} className="group/channel px-3 py-2 rounded-2xl liquid-glass-row flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.08] text-white flex items-center justify-center shrink-0">
                        <LinkedinIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white">LinkedIn</p>
                        <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[100px]">{acc.name || acc.handle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUnlinkLinkedIn(acc.id, acc.name || acc.handle)}
                        disabled={unlinkingId === acc.id}
                        className="opacity-0 group-hover/channel:opacity-100 p-1.5 rounded-lg hover:bg-white/[0.08] border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer group/btn"
                        title="Break link and disconnect LinkedIn"
                      >
                        {unlinkingId === acc.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
                        ) : (
                          <Unlink className="w-3 h-3 group-hover/btn:scale-110 group-hover/btn:-rotate-12 transition-transform duration-200" />
                        )}
                      </button>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Log Out Button */}
        <div className="pt-4 border-t border-white/[0.08]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-zinc-500" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Out Drawer & Backdrop */}
      {isMobileNavOpen && (
        <>
          <div 
            onClick={() => setIsMobileNavOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
          />
          <aside className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] liquid-glass-panel p-5 flex flex-col justify-between z-50 lg:hidden overflow-y-auto">
            <div>
              <div className="h-10 px-2 flex items-center justify-between mb-6">
                <PigeonLogo withText={true} className="w-7 h-7" />
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 rounded-full clean-glass-pill text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Navigation Items */}
              <nav className="space-y-1.5">
                <button
                  onClick={() => { setActiveNav('dashboard'); setIsMobileNavOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'dashboard'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    activeNav === 'dashboard' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
                  }`}>
                    <BarChart2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => { setActiveNav('queue'); setIsMobileNavOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'queue'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      activeNav === 'queue' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
                    }`}>
                      <GitCommit className="w-3.5 h-3.5" />
                    </div>
                    <span>Approval Queue</span>
                  </div>
                  {posts.filter(p => p.status === 'PENDING_APPROVAL').length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeNav === 'queue' ? 'bg-black text-white' : 'bg-white text-black'
                    }`}>
                      {posts.filter(p => p.status === 'PENDING_APPROVAL').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveNav('groups'); setIsMobileNavOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'groups'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    activeNav === 'groups' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
                  }`}>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span>Social Groups</span>
                </button>

                <button
                  onClick={() => { setActiveNav('repos'); setIsMobileNavOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'repos'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    activeNav === 'repos' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
                  }`}>
                    <FolderGit2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Repositories</span>
                </button>

                <button
                  onClick={() => { setActiveNav('simulator'); setIsMobileNavOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'simulator'
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    activeNav === 'simulator' ? 'bg-black text-white' : 'bg-white/[0.06] text-zinc-300'
                  }`}>
                    <PlaySquare className="w-3.5 h-3.5" />
                  </div>
                  <span>Tag Simulator</span>
                </button>
              </nav>

              {/* Section: Mode & Controls */}
              <div className="mt-8 pt-6 border-t border-white/[0.08]">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 mb-2.5">
                  Engine Mode
                </p>
                <div className="px-3.5 py-2.5 rounded-2xl liquid-glass-capsule flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-3.5 h-3.5 ${appMode === 'AUTO' ? 'text-white' : 'text-zinc-400'}`} />
                    <span className="text-xs font-medium text-zinc-200">Mode</span>
                  </div>
                  <button
                    onClick={() => handleToggleMode(appMode === 'AUTO' ? 'GUIDED' : 'AUTO')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      appMode === 'AUTO' 
                        ? 'liquid-bw-btn' 
                        : 'bg-white/[0.08] text-white border border-white/20'
                    }`}
                  >
                    {appMode}
                  </button>
                </div>
              </div>

              {/* Section: Live Channels Active */}
              <div className="mt-6 pt-5 border-t border-white/[0.08]">
                <div className="flex items-center justify-between px-3 mb-2.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Channels Active
                  </p>
                  <button
                    onClick={() => { setShowConnectModal(true); setIsMobileNavOpen(false); }}
                    className="w-5 h-5 rounded-full bg-white/[0.08] hover:bg-white text-zinc-400 hover:text-black flex items-center justify-center transition-all cursor-pointer"
                    title="Connect another account"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {connectedAccounts.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-zinc-500 font-mono">
                      No channels connected yet.
                    </div>
                  ) : (
                    connectedAccounts.map((acc: any) => (
                      <div key={acc.id} className="group/channel px-3 py-2 rounded-2xl liquid-glass-row flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-white/[0.08] text-white flex items-center justify-center shrink-0">
                            <LinkedinIcon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white">LinkedIn</p>
                            <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[100px]">{acc.name || acc.handle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleUnlinkLinkedIn(acc.id, acc.name || acc.handle)}
                            disabled={unlinkingId === acc.id}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer group/btn"
                            title="Break link and disconnect LinkedIn"
                          >
                            {unlinkingId === acc.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
                            ) : (
                              <Unlink className="w-3 h-3 group-hover/btn:scale-110 group-hover/btn:-rotate-12 transition-transform duration-200" />
                            )}
                          </button>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Guide button inside drawer for mobile */}
              {onViewHome && (
                <div className="mt-6 pt-4 border-t border-white/[0.08]">
                  <button
                    onClick={() => { onViewHome(); setIsMobileNavOpen(false); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-mono text-zinc-300 hover:text-white clean-glass-pill transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-zinc-400" />
                    <span>Platform Guide</span>
                  </button>
                </div>
              )}
            </div>

            {/* Log Out Button */}
            <div className="pt-4 border-t border-white/[0.08]">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-zinc-500" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* RIGHT MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col gap-5 sm:gap-6 overflow-y-auto z-10 pr-0 sm:pr-1 min-w-0">
        
        {/* TOP NAVBAR (Matching B/W Liquid Glass) */}
        <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Mobile Top Row: Menu Toggle, Logo & Compact Actions */}
          <div className="flex items-center justify-between lg:hidden pb-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="p-2 rounded-xl clean-glass-pill text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <PigeonLogo withText={true} className="w-7 h-7" />
            </div>

            <div className="flex items-center gap-2">
              {onViewHome && (
                <button 
                  onClick={onViewHome}
                  className="px-2.5 py-1.5 rounded-full liquid-glass-capsule text-[11px] font-mono text-zinc-300 hover:text-white"
                >
                  Guide
                </button>
              )}
              <button 
                onClick={handleManualSync}
                disabled={syncingGithub}
                className="p-2 rounded-full liquid-glass-capsule text-zinc-300 hover:text-white"
                title="Scan GitHub"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingGithub ? 'animate-spin text-white' : ''}`} />
              </button>
              <img
                src={user?.avatarUrl || 'https://avatars.githubusercontent.com/u/116521778?v=4'}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover border border-white/20"
              />
            </div>
          </div>

          {/* Liquid Glass Search Pill */}
          <div className="flex items-center gap-2.5 w-full sm:w-64 md:w-80 liquid-glass-capsule rounded-full px-3.5 py-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search commits, tags, repositories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full font-sans"
            />
          </div>

          {/* Right Header Capsule */}
          <div className="hidden lg:flex items-center gap-3">
            {onViewHome && (
              <button 
                onClick={onViewHome}
                className="px-3.5 py-2 rounded-full liquid-glass-capsule flex items-center gap-2 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="View Homepage & Interactive Guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Guide</span>
              </button>
            )}

            <button 
              onClick={handleManualSync}
              disabled={syncingGithub}
              className="px-3.5 py-2 rounded-full liquid-glass-capsule flex items-center gap-2 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Scan recent GitHub commits for #Pigeon"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingGithub ? 'animate-spin text-white' : ''}`} />
              <span>{syncingGithub ? 'Scanning GitHub...' : 'Sync GitHub'}</span>
            </button>

            <button 
              onClick={fetchDashboardData}
              disabled={loadingStats}
              className="w-10 h-10 rounded-full liquid-glass-capsule flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
            </button>

            <button className="w-10 h-10 rounded-full liquid-glass-capsule flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
            </button>

            {/* Profile Pill with Real GitHub Identity */}
            <div className="flex items-center gap-3 pl-2 pr-4 py-1.5 liquid-glass-capsule rounded-full">
              <img
                src={user?.avatarUrl || 'https://avatars.githubusercontent.com/u/116521778?v=4'}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover border border-white/20"
              />
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight">{user?.name || user?.username || 'Developer'}</p>
                <p className="text-[10px] text-zinc-400 leading-tight font-mono truncate max-w-[130px]">{user?.email || `${user?.username}@github`}</p>
              </div>
            </div>

            {/* Quick Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full liquid-glass-capsule text-xs font-mono text-zinc-300 hover:text-white hover:border-white/30 transition-all cursor-pointer"
              title="Log out of Pigeon"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* TAB 1: DASHBOARD BENTO VIEW */}
        {activeNav === 'dashboard' && (
          <div className="space-y-6">
            
            {/* TOP ROW: 3 Liquid Glass Bento Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Card 1: How many times you have tagged pigeon in a commit */}
              <div className="lg:col-span-4 liquid-glass-panel p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-capsule text-xs">
                      <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px]">
                        #
                      </span>
                      <span className="font-mono text-zinc-200">#Pigeon Commits</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">
                      All Time
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
                        {uniqueTaggedCommits}
                      </h3>
                      <span className="text-xs font-mono text-zinc-400">commits tagged</span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400 font-light">
                      Commits tagged with <code className="text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">#Pigeon</code> across your repositories
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{posts.filter(p => p.status === 'PUBLISHED').length} Dispatched</span>
                  </div>
                  <span>{posts.filter(p => p.status === 'PENDING_APPROVAL').length} Pending</span>
                </div>
              </div>

              {/* Card 2: Number of commits tagged pigeon per push */}
              <div className="lg:col-span-4 liquid-glass-panel p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-capsule text-xs">
                      <GitCommit className="w-3.5 h-3.5 text-white" />
                      <span className="font-mono text-zinc-200">Commits / Push</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {totalPushes} Push{totalPushes === 1 ? '' : 'es'}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
                        {avgCommitsPerPush}
                      </h3>
                      <span className="text-xs font-mono text-zinc-400">commits / push</span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400 font-light">
                      Average #Pigeon commits bundled per push broadcast
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map(idx => (
                        <span
                          key={idx}
                          className={`w-3.5 h-1.5 rounded-full ${
                            parseFloat(avgCommitsPerPush) >= idx
                              ? 'bg-white'
                              : parseFloat(avgCommitsPerPush) >= idx - 0.5
                              ? 'bg-white/50'
                              : 'bg-white/[0.12]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-[10px] text-zinc-500">Density</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
                    {parseFloat(avgCommitsPerPush) > 1 ? 'Batch Broadcast' : 'Single Dispatch'}
                  </span>
                </div>
              </div>

              {/* Card 3: Rate of tagging pigeon per unit time (Cadence Graph) */}
              <div className="lg:col-span-4 liquid-glass-panel p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-capsule text-xs">
                      <BarChart2 className="w-3.5 h-3.5 text-white" />
                      <span className="font-mono text-zinc-200">Tagging Cadence</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      {avgTagsPerDay} tags / day
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-light mt-1">
                    Rate of #Pigeon commits over time
                  </p>
                </div>

                {/* Cadence Graph with Gradient Fill & Points */}
                <div className="my-3 h-20 relative flex flex-col justify-end">
                  <svg viewBox="0 0 200 70" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="cadenceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={cadenceAreaPath} fill="url(#cadenceAreaGradient)" />
                    <path
                      d={cadenceLinePath}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {cadencePoints.map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={pt.count > 0 ? "2.5" : "1.5"}
                        fill={pt.count > 0 ? "#ffffff" : "#71717a"}
                      />
                    ))}
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/[0.08]">
                  {last7Days.map((d, i) => (
                    <span key={i} className={d.count > 0 ? 'text-zinc-200 font-semibold' : ''}>
                      {d.dayName}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* LINKED SOCIAL MEDIA ACCOUNTS SECTION */}
            <div className="liquid-glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Linked Social Media Accounts</h3>
                    <p className="text-[11px] text-zinc-400 font-light">
                      Channels connected to your Pigeon presence engine for automated commit broadcasting.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-3 py-1 rounded-full liquid-glass-capsule text-zinc-300">
                    {connectedAccounts.length} Channel{connectedAccounts.length === 1 ? '' : 's'} Active
                  </span>

                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full liquid-bw-btn text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect Channel</span>
                  </button>
                </div>
              </div>

              {/* Grid of Linked Social Accounts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {connectedAccounts.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs font-mono text-zinc-500">
                    No social channels linked yet. Connect a channel to begin automated broadcasting!
                  </div>
                ) : (
                  connectedAccounts.map((acc: any) => (
                    <div 
                      key={acc.id} 
                      className="p-5 rounded-2xl liquid-glass-row border border-white/[0.08] space-y-3 relative group transition-all hover:border-white/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center text-white shrink-0">
                            <LinkedinIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-white">{acc.name || acc.handle}</h4>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active & Synchronized"></span>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono">{acc.handle}</p>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/[0.08] text-emerald-300 border border-emerald-400/20">
                          Live
                        </span>
                      </div>

                      {acc.toneProfile && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                              Ascertained Account Tone:
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">Auto-Profiled</span>
                          </div>
                          <p className="text-zinc-200 font-medium leading-relaxed">
                            {acc.toneProfile.voice || 'Pragmatic, grounded engineering voice'}
                          </p>
                          {acc.toneProfile.samplePosts?.[0] && (
                            <div className="pt-1 text-[10px] text-zinc-400 font-mono italic">
                              Sample: &quot;{acc.toneProfile.samplePosts[0].slice(0, 95)}...&quot;
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>OAuth 2.0 Verified</span>
                        </div>
                        <button
                          onClick={() => handleUnlinkLinkedIn(acc.id, acc.name || acc.handle)}
                          disabled={unlinkingId === acc.id}
                          className="group/unlink px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-[11px] font-mono text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Break link and disconnect LinkedIn"
                        >
                          {unlinkingId === acc.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
                              <span>Unlinking...</span>
                            </>
                          ) : (
                            <>
                              <Unlink className="w-3.5 h-3.5 text-zinc-400 group-hover/unlink:text-white group-hover/unlink:scale-110 group-hover/unlink:-rotate-12 transition-all duration-200" />
                              <span>Unlink LinkedIn</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Add Another LinkedIn Channel / Company Page Card */}
                <div className="p-5 rounded-2xl bg-white/[0.015] border border-dashed border-white/10 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-zinc-300">
                        <LinkedinIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">Add Another LinkedIn Channel</h4>
                        <p className="text-xs text-zinc-400 font-mono">Company Page or Personal Feed</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-400/20 bg-emerald-500/10">
                      Free API
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                    Pigeon supports multi-account routing. Route major releases to your company page and engineering notes to your personal feed.
                  </p>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">Unlimited Accounts</span>
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="text-xs text-white hover:text-zinc-200 font-medium underline cursor-pointer"
                    >
                      + Connect Account
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LOWER SECTION: Commit Post History & Approval Stream Table */}
            <div className="liquid-glass-panel p-6 space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center">
                    <GitCommit className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Commit Post History & Stream</h3>
                    <p className="text-[11px] text-zinc-400 font-light">
                      Incoming <code className="text-white font-mono bg-white/[0.08] px-1.5 py-0.5 rounded">#Pigeon</code> commits with Depth-3 Code Graph analysis.
                    </p>
                  </div>
                </div>

                {/* Time Filter Pills in Pure B/W */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 p-1 rounded-full liquid-glass-capsule">
                    {(['All', '1D', '1W', '1M', '1Y'] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeFilter(tf)}
                        className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                          timeFilter === tf
                            ? 'bg-white text-black font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real Posts Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="pb-3 pl-2">Commit</th>
                      <th className="pb-3">Repository</th>
                      <th className="pb-3">Tag / Cluster</th>
                      <th className="pb-3">Draft / Content Preview</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                          No commit posts found. Push a commit tagged with <code className="text-white">#Pigeon</code> to generate drafts!
                        </td>
                      </tr>
                    ) : (
                      paginatedPosts.map(post => (
                        <tr key={post.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 pl-2 font-mono">
                            <button
                              type="button"
                              onClick={() => handleCopySha(post.commitSha)}
                              className="group/sha inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                              title={`Full SHA: ${post.commitSha} (Click to copy)`}
                            >
                              <span className="font-semibold">{post.commitSha ? post.commitSha.slice(0, 7) : '—'}</span>
                              {copiedSha === post.commitSha ? (
                                <span className="text-[10px] text-emerald-400 font-sans font-medium">copied</span>
                              ) : (
                                <Copy className="w-3 h-3 text-zinc-500 opacity-60 group-hover/sha:text-zinc-300 group-hover/sha:opacity-100 transition-all" />
                              )}
                            </button>
                          </td>
                          <td className="py-4 text-white font-medium">
                            <span className="truncate max-w-[160px] block font-mono text-[11px]">
                              {post.repoName}
                            </span>
                          </td>
                          <td className="py-4 font-mono text-zinc-400">
                            <span className="px-2 py-0.5 rounded-full liquid-glass-capsule text-[10px] text-zinc-200">
                              {post.tag}
                            </span>
                          </td>
                          <td className="py-4 text-zinc-300 max-w-sm">
                            <p className="line-clamp-2 leading-relaxed text-[11px] font-light">
                              {post.content}
                            </p>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                              post.status === 'PUBLISHED'
                                ? 'bg-white text-black font-bold'
                                : post.status === 'PENDING_APPROVAL'
                                ? 'liquid-glass-capsule text-zinc-200 border border-white/20'
                                : 'bg-white/[0.05] text-zinc-500 line-through'
                            }`}>
                              {post.status === 'PUBLISHED' && <span className="w-1.5 h-1.5 rounded-full bg-black"></span>}
                              {post.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                              {post.status}
                            </span>
                          </td>
                          <td className="py-4 font-mono text-zinc-400 text-[11px]">
                            {post.date}
                          </td>
                          <td className="py-4 pr-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {post.status === 'PENDING_APPROVAL' ? (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(post)}
                                    className="p-1.5 rounded-lg liquid-glass-capsule text-zinc-400 hover:text-white cursor-pointer"
                                    title="Edit Draft"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleApprove(post.id)}
                                    className="p-1.5 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 cursor-pointer"
                                    title="Approve & Publish to LinkedIn"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(post.id)}
                                    className="p-1.5 rounded-lg liquid-glass-capsule text-zinc-400 hover:text-white cursor-pointer"
                                    title="Reject"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleOpenEdit(post)}
                                  className="px-2.5 py-1 rounded-lg liquid-glass-capsule text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredPosts.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span>
                      Showing <span className="text-white font-medium">{(safeCurrentPage - 1) * pageSize + 1}</span>–<span className="text-white font-medium">{Math.min(safeCurrentPage * pageSize, filteredPosts.length)}</span> of <span className="text-white font-medium">{filteredPosts.length}</span> commits
                    </span>
                    <div className="flex items-center gap-1.5 pl-3 border-l border-white/[0.08]">
                      <span className="text-[11px] text-zinc-500">Rows:</span>
                      {[3, 5, 10].map(sz => (
                        <button
                          key={sz}
                          onClick={() => { setPageSize(sz); setCurrentPage(1); }}
                          className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                            pageSize === sz
                              ? 'bg-white text-black font-bold'
                              : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safeCurrentPage === 1}
                        className="p-1.5 rounded-lg liquid-glass-capsule text-zinc-400 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                          .reduce<(number | string)[]>((acc, p, idx, arr) => {
                            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                              acc.push('...');
                            }
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((item, idx) => (
                            item === '...' ? (
                              <span key={`dots-${idx}`} className="px-1 text-zinc-600">…</span>
                            ) : (
                              <button
                                key={item}
                                onClick={() => setCurrentPage(item as number)}
                                className={`w-7 h-7 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                                  safeCurrentPage === item
                                    ? 'bg-white text-black font-bold shadow-sm'
                                    : 'hover:bg-white/[0.06] text-zinc-400 hover:text-white'
                                }`}
                              >
                                {item}
                              </button>
                            )
                          ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="p-1.5 rounded-lg liquid-glass-capsule text-zinc-400 hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 2: APPROVAL QUEUE (BROADCAST & GROUP SENDS) */}
        {activeNav === 'queue' && (
          <div className="space-y-6">
            <div className="liquid-glass-panel p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-light text-white tracking-tight">Push Broadcast Queue</h3>
                  <p className="text-xs text-zinc-400 font-light mt-1">
                    Each push represents a unified broadcast. Review distinct posts summarizing all changes in the push before dispatching.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-capsule text-xs font-mono">
                  <span>Pending Broadcasts:</span>
                  <span className="font-bold text-white">
                    {broadcastGroups.length}
                  </span>
                </div>
              </div>

              {/* Feed of Broadcasts */}
              <div className="space-y-6 pt-2">
                {broadcastGroups.length === 0 ? (
                  <div className="py-16 text-center text-zinc-500 font-mono text-xs">
                    Queue is clear! All commit broadcasts have been reviewed and dispatched.
                  </div>
                ) : (
                  broadcastGroups.map(broadcast => {
                    const activeChannelId = selectedChannelPerCommit[broadcast.commitSha] || broadcast.channelPosts[0]?.id;
                    const activePost = broadcast.channelPosts.find(p => p.id === activeChannelId) || broadcast.channelPosts[0];

                    return (
                      <div key={broadcast.commitSha} className="p-6 rounded-2xl liquid-glass-panel space-y-5 border border-white/[0.08]">
                        {/* Broadcast Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-white/[0.06] pb-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-zinc-300 font-bold px-2.5 py-1 rounded-lg bg-white/[0.08]">
                              {broadcast.commitSha.slice(0, 7)}
                            </span>
                            <span className="text-white font-medium">{broadcast.repoName}</span>
                            <span className="px-2.5 py-1 rounded-full liquid-glass-capsule text-[11px] text-zinc-200 font-mono font-semibold">
                              {broadcast.tag}
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-[10px] font-mono text-emerald-300 border border-emerald-400/20">
                              {broadcast.channelPosts[0]?.matchedGroupName 
                                ? `Group: ${broadcast.channelPosts[0].matchedGroupName}` 
                                : `Broadcast: All Channels (${broadcast.channelPosts.length})`}
                            </span>
                          </div>
                          <span className="font-mono text-zinc-500 text-[11px]">{broadcast.date}</span>
                        </div>

                        {/* Push Summary Message */}
                        <div className="text-xs font-mono text-zinc-300 flex items-start gap-2">
                          <span className="text-zinc-500 shrink-0">Push Summary:</span>
                          <span className="text-white font-sans">{broadcast.commitMessage}</span>
                        </div>

                        {/* Distinct Channel Tabs for this Broadcast */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">
                              Channel Preview:
                            </span>
                            {broadcast.channelPosts.map(cp => {
                              const isSelected = cp.id === activePost?.id;
                              return (
                                <button
                                  key={cp.id}
                                  onClick={() => setSelectedChannelPerCommit(prev => ({ ...prev, [broadcast.commitSha]: cp.id }))}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-white text-black font-semibold' 
                                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  <LinkedinIcon className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-zinc-300'}`} />
                                  <span>LinkedIn</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Distinct Message Box for the Selected Channel */}
                          {activePost && (
                            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed space-y-3">
                              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-white/[0.04] pb-2">
                                <span>Tailored for: LinkedIn</span>
                                <span className="text-zinc-400 font-mono">Distinct Tone Profile Applied</span>
                              </div>
                              <p className="text-xs sm:text-[13px] text-zinc-100 font-story leading-relaxed">
                                {activePost.content}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Depth-3 Context Files */}
                        {broadcast.depthFilesAnalyzed && broadcast.depthFilesAnalyzed.length > 0 && (
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                            <span className="text-zinc-500">Depth-3 Context:</span>
                            {broadcast.depthFilesAnalyzed.slice(0, 4).map(file => (
                              <span key={file} className="px-2 py-0.5 rounded bg-white/[0.05] text-zinc-300 text-[10px]">
                                {file}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Broadcast Actions: 1 Reject, 1 Edit, 1 Approve & Broadcast */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                          <button
                            onClick={() => handleRejectBroadcast(broadcast.commitSha)}
                            className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Reject Broadcast
                          </button>
                          {activePost && (
                            <button
                              onClick={() => handleOpenEdit(activePost)}
                              className="px-4 py-2 rounded-xl liquid-glass-capsule text-xs text-white cursor-pointer flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Channel Copy</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleApproveBroadcast(broadcast.commitSha)}
                            className="px-6 py-2.5 rounded-xl liquid-bw-btn text-xs font-semibold cursor-pointer flex items-center gap-2 shadow-lg"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve & Broadcast to All Channels</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOCIAL GROUPS & COMMIT TAGS */}
        {activeNav === 'groups' && (
          <div className="space-y-6">
            <div className="liquid-glass-panel p-8 space-y-6">
              <div>
                <h3 className="text-xl font-light text-white tracking-tight">Social Groups & Target Routing</h3>
                <p className="text-xs text-zinc-400 font-light mt-1">
                  Route commits to specific accounts using tags like <code className="text-white font-mono bg-white/[0.08] px-2 py-0.5 rounded">#Pigeon-g&lt;GroupName&gt;</code>.
                </p>
              </div>

              {/* Create Group Box */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Create Targeted Social Group</h4>
                  <span className="text-[11px] font-mono text-zinc-400">Precision Routing</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Group name (e.g. CoreTeam, Release, Founders)"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Description / target purpose"
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={handleCreateGroup}
                    disabled={creatingGroup || !newGroupName.trim()}
                    className="px-6 py-2.5 rounded-xl liquid-bw-btn text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    {creatingGroup ? 'Creating...' : 'Create Group'}
                  </button>
                </div>

                {/* Account Selection for New Group */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-zinc-400 uppercase tracking-wider">
                      Select Accounts to Assign ({selectedGroupAccountIds.length || connectedAccounts.length} of {connectedAccounts.length} selected):
                    </span>
                    <span className="text-zinc-500 font-light">
                      {selectedGroupAccountIds.length === 0 ? 'Default: All current accounts' : 'Targeted subset'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {connectedAccounts.map(acc => {
                      const isSelected = selectedGroupAccountIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setSelectedGroupAccountIds(prev => 
                              prev.includes(acc.id) ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-white text-black font-semibold shadow-md' 
                              : 'bg-white/[0.04] text-zinc-400 border border-white/10 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            isSelected ? 'bg-black text-white' : 'bg-white/20 text-transparent'
                          }`}>
                            ✓
                          </div>
                          <span>{acc.name || acc.handle}</span>
                          <span className="text-[10px] font-mono opacity-60">({acc.platform})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Group Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {groups.length === 0 ? (
                  <div className="col-span-2 p-8 rounded-2xl liquid-glass-panel text-center space-y-2">
                    <p className="text-sm text-zinc-300">No social groups created yet.</p>
                    <p className="text-xs text-zinc-500 font-light">
                      Create a group above to cluster your accounts and route specific git commits using tags like <code className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">#Pigeon-g-CoreTeam</code>.
                    </p>
                  </div>
                ) : (
                  groups.map(grp => {
                    const memberAccountIds = (grp.members || []).map((m: any) => m.socialAccountId || m.socialAccount?.id).filter(Boolean);
                    return (
                      <div key={grp.id} className="p-6 rounded-2xl liquid-glass-panel space-y-4 relative group border border-white/[0.08]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base font-semibold text-white">{grp.name}</span>
                            <p className="text-xs text-zinc-400 font-light mt-0.5">{grp.description || 'Custom target cluster'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => {
                                setSimCommitMsg(`feat: ship update #Pigeon-g-${grp.name}`);
                                setActiveNav('simulator');
                              }}
                              className="text-xs font-mono px-2.5 py-1 rounded-full liquid-glass-capsule text-emerald-300 border border-emerald-400/20 cursor-pointer hover:bg-white/10 transition-colors"
                              title="Click to test this tag in the simulator"
                            >
                              #Pigeon-g-{grp.name}
                            </span>
                            <button
                              onClick={() => handleDeleteGroup(grp.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition-opacity"
                              title="Delete Group"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Interactive Member Account Assignment Pills */}
                        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                            <span>Assigned Accounts ({memberAccountIds.length}):</span>
                            <span className="text-[10px] text-zinc-500">Click pill to toggle account</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {connectedAccounts.map(acc => {
                              const isMember = memberAccountIds.includes(acc.id);
                              return (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() => handleToggleAccountInGroup(grp.id, acc.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isMember
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                                      : 'bg-white/[0.02] text-zinc-500 border border-white/5 hover:text-zinc-300 hover:bg-white/[0.05]'
                                  }`}
                                  title={isMember ? 'Click to remove from group' : 'Click to add to group'}
                                >
                                  <span>{isMember ? '✓' : '+'}</span>
                                  <span>{acc.name || acc.handle}</span>
                                  <span className="text-[9px] font-mono opacity-60">({acc.platform})</span>
                                </button>
                              );
                            })}
                          </div>

                          <p className="text-[10px] font-mono text-zinc-500 pt-1">
                            Commits tagged with <code className="text-zinc-300 bg-white/5 px-1 py-0.5 rounded">#Pigeon-g-{grp.name}</code> post strictly to these {memberAccountIds.length} account(s).
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REPOSITORIES & DEPTH-3 ARCHITECTURAL GRAPH */}
        {activeNav === 'repos' && (
          <div className="space-y-6">
            <div className="liquid-glass-panel p-8 space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-light text-white tracking-tight">Active Repositories & Context Graph</h3>
                  <p className="text-xs text-zinc-400 font-light mt-1">
                    Just-In-Time tracking active: only repositories activated via <code className="font-mono text-zinc-300">#Pigeon</code> tagged commits are kept in the database.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {repositories.length > 0 && (
                    <button
                      onClick={handlePurgeAllRepos}
                      className="px-3 py-2 rounded-xl border border-red-500/20 text-red-400/80 hover:text-red-300 hover:border-red-500/40 text-xs font-mono cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors"
                      title="Clear all tracked repos to start fresh with pure JIT discovery"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}

                  <button
                    onClick={handleIndexAllRepos}
                    disabled={indexingRepos || repositories.length === 0}
                    className="px-4 py-2 rounded-xl liquid-bw-btn text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${indexingRepos ? 'animate-spin' : ''}`} />
                    <span>{indexingRepos ? 'Analyzing Codebases...' : 'Re-sync Context'}</span>
                  </button>
                </div>
              </div>

              {/* JIT Informational Capsule */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-medium text-white flex items-center gap-2">
                    <span>Zero-Overhead Event Discovery</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">Lean DB Mode</span>
                  </div>
                  <p className="text-zinc-400 font-light leading-relaxed">
                    You don't need to manually import your repositories. Whenever you push a commit tagged with <code className="font-mono text-zinc-200">#Pigeon</code> or <code className="font-mono text-zinc-200">#Pigeon-g&lt;GroupName&gt;</code> to any project, Pigeon automatically discovers, indexes, and registers that repository in your database on-demand.
                  </p>
                </div>
              </div>

              {/* Repositories List or Empty State */}
              {repositories.length === 0 ? (
                <div className="py-16 px-6 text-center rounded-2xl liquid-glass-panel border border-dashed border-white/15 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                    <FolderGit2 className="w-6 h-6 text-zinc-300" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h4 className="text-sm font-medium text-white">Database is Completely Lean</h4>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">
                      No unnecessary repositories are stored. As soon as you push code with the <code className="font-mono text-zinc-300">#Pigeon</code> tag, that project will be registered and indexed right here.
                    </p>
                  </div>
                  <div className="inline-block p-3 rounded-xl bg-black/60 border border-white/10 text-left font-mono text-[11px] text-zinc-300 space-y-1">
                    <div className="text-zinc-500"># Push code with tag to register on-the-fly:</div>
                    <div><span className="text-zinc-500">$</span> git commit -m &quot;Ship payment streaming core <span className="text-white font-bold">#Pigeon</span>&quot;</div>
                    <div><span className="text-zinc-500">$</span> git push origin main</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {repositories.map(repo => (
                    <div key={repo.remoteUrl} className="p-6 rounded-2xl liquid-glass-panel space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center">
                            <FolderGit2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{repo.name}</h4>
                            <span className="text-[11px] font-mono text-zinc-400">{repo.remoteUrl}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-3 py-1 rounded-full liquid-glass-capsule text-zinc-300">
                            Branch: {repo.defaultBranch}
                          </span>
                          <button
                            onClick={() => handleToggleRepoMode(repo.remoteUrl, repo.defaultMode)}
                            className={`text-xs font-mono px-3 py-1 rounded-full font-bold cursor-pointer transition-all ${
                              repo.defaultMode === 'AUTO' 
                                ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:bg-emerald-300' 
                                : 'bg-white text-black hover:bg-zinc-200'
                            }`}
                            title="Click to toggle between AUTO (auto-publish) and GUIDED (approval queue)"
                          >
                            {repo.defaultMode}
                          </button>
                          <button
                            onClick={() => handleUntrackRepo(repo.remoteUrl)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
                            title="Untrack & remove repository from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tech Stack Pills */}
                      {repo.techStack && repo.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {repo.techStack.map(t => (
                            <span key={t} className="px-2.5 py-0.5 rounded-lg liquid-glass-capsule text-[10px] font-mono text-zinc-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pinned Architectural Context */}
                      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-1.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                          Pinned Architectural Context (Injected into Gemini Prompts):
                        </span>
                        <p className="text-xs text-zinc-300 font-light leading-relaxed">
                          {repo.pinnedContext || 'Key architectural modules verified: zero-copy memory buffers, depth-3 dependency graphs, and deterministic proof trees.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 6: TAG SIMULATOR */}
        {activeNav === 'simulator' && (
          <div className="space-y-6">
            <div className="liquid-glass-panel p-8 space-y-6 max-w-3xl">
              <div>
                <h3 className="text-xl font-light text-white tracking-tight">Commit Message Tag Simulator</h3>
                <p className="text-xs text-zinc-400 font-light mt-1">
                  Type a git commit message to test how Pigeon extracts your tags, routes to groups, and crafts platform copy.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={simCommitMsg}
                  onChange={e => setSimCommitMsg(e.target.value)}
                  placeholder="e.g. feat: add recursive snark verifier #Pigeon-gCoreTeam"
                  className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                />
                <button
                  onClick={handleRunSimulator}
                  disabled={simulating}
                  className="px-6 py-3 rounded-2xl liquid-bw-btn text-xs font-semibold cursor-pointer shrink-0"
                >
                  {simulating ? 'Analyzing...' : 'Run Simulation'}
                </button>
              </div>

              {simOutput && (
                <div className="space-y-5 pt-4 border-t border-white/[0.08]">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                      <span className="text-zinc-500">Resolved Target:</span>
                      <span className="px-3 py-1 rounded-full bg-white text-black font-bold">
                        {simOutput.group}
                      </span>
                    </div>
                    {simOutput.accountsDesc && (
                      <p className="text-[11px] font-mono text-emerald-400">
                        🎯 {simOutput.accountsDesc}
                      </p>
                    )}
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2.5 text-xs font-medium text-white">
                        <LinkedinIcon className="w-4 h-4 text-white" />
                        <span>LinkedIn Generated Draft</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        100% Free API • Ready for Publish
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap font-story">
                      {simOutput.li || simOutput.x}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Frosted Liquid Glass Edit & Review Modal */}
      {editingDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xl liquid-glass-panel p-7 space-y-5 shadow-[0_35px_80px_rgba(0,0,0,0.95)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Review & Edit Generated Post</h4>
                  <p className="text-[11px] text-zinc-400 font-mono">{editingDraft.commitSha} • {editingDraft.repoName}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingDraft(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Depth-3 inspected context */}
            <div className="p-3.5 rounded-2xl liquid-glass-capsule text-xs">
              <span className="font-semibold text-zinc-300 text-[11px]">Architectural Skeleton (Depth-3 Context):</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {editingDraft.depthFilesAnalyzed.map(f => (
                  <span key={f} className="px-2 py-0.5 rounded-lg bg-white/[0.06] text-zinc-200 font-mono text-[10px]">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Textarea for generated copy */}
            <textarea
              rows={6}
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              className="w-full bg-black/50 border border-white/[0.1] focus:border-white/30 rounded-2xl p-4 text-xs text-white focus:outline-none resize-none leading-relaxed font-sans"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingDraft(null)}
                className="px-5 py-2.5 rounded-2xl text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2.5 rounded-2xl liquid-bw-btn text-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liquid Glass Connect Channel Dialog */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg liquid-glass-panel p-8 space-y-6 shadow-[0_35px_80px_rgba(0,0,0,0.95)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Connect Developer Channel</h4>
                  <p className="text-[11px] text-zinc-400">Link another social account to Pigeon</p>
                </div>
              </div>
              <button 
                data-testid="close-connect-modal"
                onClick={() => {
                  setShowConnectModal(false);
                }}
                className="text-zinc-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* LinkedIn Option */}
              <div className="p-5 rounded-2xl liquid-glass-row border border-white/[0.08] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl clean-glass-pill flex items-center justify-center text-white shrink-0">
                    <LinkedinIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-white">LinkedIn (Live OAuth 2.0)</h5>
                    <p className="text-[11px] text-zinc-400 font-light">
                      Connect your personal profile or company presence. 100% free API.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/api/socials/auth-url/linkedin?userId=${user?.id}`);
                        const data = await res.json();
                        if (data.url) {
                          setLinkedInAuthUrl(data.url);
                          setHasClickedSignout(false);
                          setShowConnectModal(false);
                          setShowLinkedInAccountModal(true);
                        }
                      } catch (err) {
                        console.error('Failed to get LinkedIn auth URL:', err);
                      }
                    }}
                    className="px-4 py-2 rounded-xl liquid-bw-btn text-xs font-semibold cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowConnectModal(false);
                }}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated LinkedIn Account Selection & Switcher Modal */}
      {showLinkedInAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md clean-liquid-glass p-7 space-y-5 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center">
                  <LinkedinIcon className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Connect LinkedIn Profile</h4>
                  <p className="text-[11px] text-zinc-400">Account Selection & Auth</p>
                </div>
              </div>
              <button 
                data-testid="close-linkedin-modal"
                onClick={() => setShowLinkedInAccountModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 font-light leading-relaxed">
              LinkedIn binds authorizations to your active browser cookies on <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono">linkedin.com</code>.
            </p>

            {/* Option A: Fast 1-click connect active profile */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">Option A (Fastest)</span>
              <h5 className="text-xs font-medium text-white">Connect Currently Logged-In Account</h5>
              <p className="text-[11px] text-zinc-400 font-light">
                Use whichever profile is currently signed in on LinkedIn in this browser.
              </p>
              <button
                onClick={() => {
                  sessionStorage.setItem('pigeon_oauth_source', 'dashboard');
                  window.location.href = linkedInAuthUrl;
                }}
                className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Connect Active Profile (1-Click)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Option B: Connect a different account */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">Option B (Switch / Add Another Account)</span>
              <h5 className="text-xs font-medium text-white">Connect A Different LinkedIn Profile</h5>
              <p className="text-[11px] text-zinc-400 font-light">
                Sign out of LinkedIn.com first so LinkedIn shows the login screen where you can type email and password for your other profile.
              </p>
              
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    window.open('https://www.linkedin.com/m/logout', '_blank');
                    setHasClickedSignout(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl clean-glass-pill text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>1. Sign Out on LinkedIn.com</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('pigeon_oauth_source', 'dashboard');
                    window.location.href = linkedInAuthUrl;
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    hasClickedSignout 
                      ? 'bg-emerald-400 text-black hover:bg-emerald-300' 
                      : 'bg-white/10 text-zinc-300 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <span>2. Proceed to Sign In with Other Profile →</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
