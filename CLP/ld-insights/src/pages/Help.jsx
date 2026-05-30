const faqs = [
  { q: 'How are "At-Risk" learners identified?', a: 'Learners are flagged as at-risk when their compliance drops below the configured threshold, or when they miss 2+ mandatory sessions within a 30-day window.' },
  { q: 'How often does data sync from the LMS?', a: 'Data syncs every 4 hours by default. A full sync runs every Sunday at 2 AM. You can trigger a manual sync from the Rule Configuration page.' },
  { q: 'Who receives intervention notifications?', a: 'Notifications go to the learner, their direct manager, and the assigned L&D administrator, depending on the rule configuration.' },
  { q: 'Can I customize the alert thresholds?', a: 'Yes — navigate to Settings to adjust the global compliance threshold, or use Rule Configuration to create fine-grained rules per department or course.' },
  { q: 'How do I export a compliance report?', a: 'Go to the Reporting page and click "Export Report" in the top-right corner. Reports are exported as CSV or PDF.' },
]

export default function Help() {
  return (
    <div className="space-y-lg max-w-2xl">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-background">Help & Support</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Find answers to common questions or reach out to our support team.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {[
          { icon: 'menu_book', label: 'Documentation', desc: 'Full user guide' },
          { icon: 'video_library', label: 'Video Tutorials', desc: 'Step-by-step walkthroughs' },
          { icon: 'support_agent', label: 'Contact Support', desc: 'Live chat & email' },
        ].map((item) => (
          <button key={item.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md text-left hover:bg-surface-container transition-colors hover:shadow-sm">
            <span className="material-symbols-outlined text-secondary mb-2" style={{ fontSize: 28 }}>{item.icon}</span>
            <div className="text-body-sm font-bold text-on-background">{item.label}</div>
            <div className="text-body-sm text-on-surface-variant mt-0.5">{item.desc}</div>
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-md border-b border-outline-variant">
          <h3 className="text-headline-sm font-headline-sm text-on-background">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {faqs.map((faq) => (
            <div key={faq.q} className="p-md">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontSize: 18 }}>help_outline</span>
                <div>
                  <div className="text-body-sm font-bold text-on-background mb-1">{faq.q}</div>
                  <div className="text-body-sm text-on-surface-variant leading-relaxed">{faq.a}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact box */}
      <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-md flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary shrink-0">mail</span>
        <div>
          <div className="text-body-sm font-bold text-on-background">Still need help?</div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Contact us at <a href="mailto:support@ldinsights.io" className="text-secondary hover:underline">support@ldinsights.io</a> or open a ticket via the support portal. Response time: &lt;4 hours for urgent, 24h for standard.
          </p>
        </div>
      </div>
    </div>
  )
}
