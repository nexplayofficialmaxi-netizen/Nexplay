import {useEffect, useState, type FormEvent} from 'react';
import {CheckCircle2, Mail, Send} from 'lucide-react';
import type {LocalizedContent} from '../data/nexplayData';

interface MissionAndContactSectionProps {
  preselectedTopic: string;
  copy: LocalizedContent['missionContact'];
}

export function MissionAndContactSection({
  preselectedTopic,
  copy,
}: MissionAndContactSectionProps) {
  const [name, setName] = useState('');
  const [topicId, setTopicId] = useState(preselectedTopic || copy.topics[0].id);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (preselectedTopic && copy.topics.some((t) => t.id === preselectedTopic)) {
      setTopicId(preselectedTopic);
      setSubmitted(false);
    }
  }, [preselectedTopic, copy.topics]);

  const selectedTopicLabel =
    copy.topics.find((t) => t.id === topicId)?.label ?? copy.topics[0].label;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 2) {
      setError(copy.errName);
      return;
    }

    if (trimmedMessage.length < 10) {
      setError(copy.errMessage);
      return;
    }

    setSubmitted(true);
  };

  const handleReset = () => {
    setName('');
    setMessage('');
    setError(null);
    setSubmitted(false);
  };

  return (
    <section
      id="mision"
      className="py-16 lg:py-24 bg-slate-100/70 dark:bg-[#0C1017]"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Mission editorial column */}
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[var(--accent-text)]">
              {copy.missionKicker}
            </p>
            <h2 className="mt-2 font-display text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              {copy.missionTitle}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {copy.missionBody}
            </p>

            <div className="mt-8 space-y-5 border-t border-slate-200 dark:border-white/[0.08] pt-6">
              <div>
                <p className="text-xs font-medium text-[var(--accent-text)]">
                  {copy.originLabel}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {copy.originText}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--accent-text)]">
                  {copy.visionLabel}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {copy.visionText}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {copy.directMailLabel}
                </p>
                <a
                  href="mailto:nexplayofficialmaxi@gmail.com"
                  className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[var(--accent-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)] rounded-sm"
                >
                  <Mail className="w-4 h-4 text-[var(--accent-text)]" aria-hidden="true" />
                  nexplayofficialmaxi@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Contact & Support Form (without email input) */}
          <div
            id="contacto"
            className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#11161E] p-6 sm:p-8"
          >
            <p className="text-xs font-medium text-[var(--accent-text)]">
              {copy.contactKicker}
            </p>
            <h3 className="mt-1.5 font-display text-2xl font-bold text-slate-900 dark:text-white">
              {copy.contactTitle}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {copy.contactSubtitle}
            </p>

            {submitted ? (
              <div
                role="status"
                className="mt-6 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-[var(--accent-text)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h4 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                      {copy.successTitle}
                    </h4>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {copy.successBodyPrefix}{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">{name}</span>.{' '}
                      {copy.successBodyMiddle}{' '}
                      <span className="font-semibold text-[var(--accent-text)]">
                        {selectedTopicLabel}
                      </span>
                      .
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-4 inline-flex items-center rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.06] px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.12] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
                    >
                      {copy.successReset}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                      {copy.nameLabel}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={copy.namePlaceholder}
                      required
                      className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090C11] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[var(--accent-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-topic"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                      {copy.topicLabel}
                    </label>
                    <select
                      id="contact-topic"
                      value={topicId}
                      onChange={(e) => setTopicId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090C11] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[var(--accent-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
                    >
                      {copy.topics.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
                    {copy.messageLabel}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={copy.messagePlaceholder}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090C11] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[var(--accent-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)] resize-y"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {copy.teamNote}
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-on)] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-main)]"
                  >
                    {copy.submitButton}
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
