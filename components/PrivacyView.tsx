import React, { useState } from 'react';

interface PrivacyViewProps {
  onBack: () => void;
  onDeleteMyData: () => Promise<void>;
}

// Plain-language privacy notice and terms, plus "delete my data".
export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack, onDeleteMyData }) => {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDeleteMyData();
    } catch (e: any) {
      setError(e.message || 'Could not delete your data. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-gray-700 leading-relaxed">
      <button onClick={onBack} className="text-marian-700 hover:text-marian-600 font-semibold">
        ← Back
      </button>
      <h1 className="font-serif text-3xl text-marian-800">Privacy &amp; Terms</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-marian-800">What we keep</h2>
        <p>
          Your browser gets a random, anonymous ID so the app can recognise it. You don't need an account to pray. If you
          sign in with Google, we keep your name and email address (nothing else from your Google account) to recognise
          you on every device and, while the app is invite-only, to know who invited whom. We also keep your invite codes
          and whether they've been used.
        </p>
        <p>
          When you send a prayer card, we keep the card (the occasion, design, prayer, the names you typed and your note) so
          the person you send it to can open it. Anyone with its private link can open it, so share the link only with
          them. Your note is checked for chain-letter wording and similar by our own rules and by TypeSafe's JEV checker;
          if it names a saint who isn't on our verified list, we keep just that name (not your note) for a person to look at.
        </p>
        <p>If you join the waitlist, we keep that email address only to send you an invite.</p>
        <p>We don't sell your data, show ads or charge for praying.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-marian-800">The prayers</h2>
        <p>
          The official prayers in Rosa Maria are never written or changed by AI. Each one is copied from an approved
          Church source (such as the Vatican's Compendium of the Catechism, the USCCB or the CBCP), checked by a person,
          and shown with its source. A prayer that hasn't been checked yet is marked "awaiting review".
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-marian-800">Fair use</h2>
        <p>Rosa Maria is free. Features may change while it's being built. The service is provided as is.</p>
      </section>

      <section className="space-y-3 p-4 rounded-xl bg-white border border-marian-100">
        <h2 className="text-lg font-semibold text-marian-800">Delete my data</h2>
        <p>
          This permanently deletes what we keep about you from our servers, including the cards you sent (their links stop
          working), and unlinks your Google account. You'll start
          fresh. While the app is invite-only you'd need a new invite to come back.
        </p>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Delete my data
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Yes, delete everything'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="bg-gray-200 hover:bg-gray-300 text-ink font-semibold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}
        {error && <p className="text-red-700">{error}</p>}
      </section>
    </div>
  );
};
