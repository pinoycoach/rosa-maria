import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeView, type Door } from './components/HomeView';
import { MessageBox } from './components/MessageBox';
import { LockScreen } from './components/LockScreen';
import { getPasscode, LOCKED_EVENT, NOT_MEMBER_EVENT, resetSession } from './services/apiFetch';
import { deleteMyData, getStatus, signInWithGoogle, type AccountStatus } from './services/rosaApi';
import { PrivacyView } from './components/PrivacyView';
import { PrayersView } from './components/PrayersView';
import { RosaryView } from './components/RosaryView';
import { CardComposer } from './components/CardComposer';
import { CardOpenView } from './components/CardOpenView';
import { SaintOfTheDay } from './components/SaintOfTheDay';
import { CurateView } from './components/CurateView';
import { InviteGate } from './components/InviteGate';
import { InvitesCard } from './components/InvitesCard';
import { GoogleSignInButton } from './components/GoogleSignInButton';

type View = 'home' | Door | 'prayers' | 'privacy' | 'curate' | 'card' | 'decade';

// A card's private link: /c/<id>.
const cardIdFromPath = () => /^\/c\/([A-Za-z0-9_-]{16})\/?$/.exec(window.location.pathname)?.[1] || null;

function App() {
  // The review desk has no button; it opens at /#curate. A card link opens the card.
  const [cardId] = useState(cardIdFromPath);
  const [view, setView] = useState<View>(() => (window.location.hash === '#curate' ? 'curate' : cardId ? 'card' : 'home'));
  const [replyTo, setReplyTo] = useState('');
  useEffect(() => {
    const onHash = () => window.location.hash === '#curate' && setView('curate');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // The server may require a passcode (APP_PASSCODE); any 401 brings the lock back.
  const [locked, setLocked] = useState(false);
  // Invite-only beta: Google sign-in + an invite code; `gated` shows the invite page.
  const [inviteOnly, setInviteOnly] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [gated, setGated] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (config) => {
        setGoogleClientId(config?.googleClientId || null);
        setInviteOnly(!!config?.inviteOnly);
        if (config?.locked && !getPasscode()) setLocked(true);
        else {
          const s = await getStatus().catch(() => null);
          setStatus(s);
          if (config?.inviteOnly && !s?.member) setGated(true);
        }
      })
      .catch(() => {});
    const onLocked = () => setLocked(true);
    const onNotMember = () => setGated(true);
    window.addEventListener(LOCKED_EVENT, onLocked);
    window.addEventListener(NOT_MEMBER_EVENT, onNotMember);
    return () => {
      window.removeEventListener(LOCKED_EVENT, onLocked);
      window.removeEventListener(NOT_MEMBER_EVENT, onNotMember);
    };
  }, []);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleBecameMember = async () => {
    setStatus(await getStatus().catch(() => null));
    setGated(false);
    setLoadKey((k) => k + 1);
  };

  // Outside the invite-only beta, signing in is optional: it recognises you on every device.
  const handleFooterSignIn = async (credential: string) => {
    try {
      const r = await signInWithGoogle(credential);
      if (r.token) return window.location.reload(); // switched to this account's user
      setStatus(await getStatus().catch(() => null));
      showMessage(`Signed in as ${r.email}`, 'success');
    } catch (e: any) {
      showMessage(e.message || 'Google sign-in failed.', 'error');
    }
  };

  const handleSignOut = () => {
    resetSession();
    window.location.reload();
  };

  const handleDeleteMyData = async () => {
    await deleteMyData();
    resetSession();
    window.location.reload();
  };

  const goHome = () => {
    if (window.location.hash || window.location.pathname !== '/') history.replaceState(null, '', '/');
    setReplyTo('');
    setView('home');
    window.scrollTo(0, 0);
  };

  // Someone opening a card (and praying a decade from it) needs no passcode or account.
  const publicView = view === 'card' || view === 'decade';

  if (locked && !publicView) return <LockScreen onUnlocked={() => { setLocked(false); setLoadKey((k) => k + 1); }} />;
  if (gated && view !== 'curate' && !publicView) {
    return <InviteGate googleClientId={googleClientId} status={status} onMember={handleBecameMember} onStatus={setStatus} />;
  }

  return (
    <div className="bg-cream text-ink min-h-screen font-sans print:bg-white print:text-black">
      {message && <MessageBox message={message.text} type={message.type} />}
      <Header onHome={goHome} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {view === 'home' && <HomeView onOpen={setView} onPrayers={() => setView('prayers')} />}
        {view === 'home' && (
          <div className="mt-8">
            <SaintOfTheDay />
          </div>
        )}
        {view === 'rosary' && <RosaryView onBack={goHome} />}
        {view === 'cards' && <CardComposer key={replyTo} onHome={goHome} replyTo={replyTo} />}
        {view === 'card' && cardId && (
          <CardOpenView
            id={cardId}
            onPrayDecade={() => setView('decade')}
            onSendBack={(name) => {
              history.replaceState(null, '', '/');
              setReplyTo(name);
              setView('cards');
            }}
          />
        )}
        {view === 'decade' && <RosaryView oneDecade onBack={() => setView('card')} />}
        {view === 'home' && inviteOnly && status?.member && <InvitesCard key={loadKey} />}
        {view === 'prayers' && <PrayersView onBack={goHome} />}
        {view === 'curate' && <CurateView onBack={goHome} />}
        {view === 'privacy' && <PrivacyView onBack={goHome} onDeleteMyData={handleDeleteMyData} />}
      </main>

      <footer className="print:hidden max-w-3xl mx-auto px-4 sm:px-6 pb-10 text-center text-sm text-gray-500">
        Rosa Maria · Free to pray, always ·{' '}
        <button onClick={() => setView('privacy')} className="underline hover:text-marian-700">
          Privacy &amp; Terms
        </button>
        {status?.signedIn ? (
          <p className="mt-2">
            Signed in as {status.email} ·{' '}
            <button onClick={handleSignOut} className="underline hover:text-marian-700">Sign out</button>
          </p>
        ) : (
          googleClientId && !inviteOnly && (
            <div className="mt-3 space-y-1">
              <p>Sign in to be recognised on every device. You don't need to sign in to pray.</p>
              <GoogleSignInButton clientId={googleClientId} onCredential={handleFooterSignIn} />
            </div>
          )
        )}
      </footer>
    </div>
  );
}

export default App;
