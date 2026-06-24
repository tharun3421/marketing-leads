import React from 'react';
import { TextArea } from '../UI/Input';
import { 
  User, 
  Briefcase, 
  Layers, 
  ShieldCheck, 
  DollarSign, 
  CalendarRange, 
  Globe
} from 'lucide-react';

export default function StepReviewSubmit({ register, watch, errors, formValues: propFormValues }) {
  const watchedFormValues = watch();
  const formValues = propFormValues || watchedFormValues;

  return (
    <div className="space-y-5">

      {/* Review Card */}
      <div className="border-t border-gray-100 dark:border-slate-800/60 pt-4">
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
          Summary Verification
        </h4>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {/* Representative & Client */}
          <div className="p-3.5 bg-gray-50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800/40 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
              <User className="w-3.5 h-3.5 text-indigo-500" /> Account Assignment
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 text-xs gap-x-4 gap-y-1">
              <div><span className="text-gray-400">Salesperson:</span> <span className="font-semibold text-gray-900 dark:text-white">{formValues.salespersonName || '—'}</span></div>
              <div><span className="text-gray-400">Client Contact:</span> <span className="font-semibold text-gray-900 dark:text-white">{formValues.clientName || '—'}</span></div>
              <div><span className="text-gray-400">Company Name:</span> <span className="text-gray-900 dark:text-white">{formValues.companyName || '—'}</span></div>
              <div><span className="text-gray-400">Category:</span> <span className="text-gray-900 dark:text-white">{formValues.businessCategory || '—'}</span></div>
              <div><span className="text-gray-400">Email:</span> <span className="text-gray-900 dark:text-white">{formValues.email || '—'}</span></div>
              <div><span className="text-gray-400">Mobile:</span> <span className="text-gray-900 dark:text-white">{formValues.mobileNumber || '—'}</span></div>
              <div className="md:col-span-2"><span className="text-gray-400">Assigned Team:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">{(() => {
                const val = formValues.assignedTeam;
                if (!val) return '—';
                if (val === 'all') return 'All Teams';
                if (Array.isArray(val)) {
                  if (val.includes('all')) return 'All Teams';
                  if (val.length === 0) return '—';
                  const names = val.map(t => {
                    if (t === 'design') return 'Designing';
                    if (t === 'developer') return 'Developer';
                    if (t === 'ads') return 'Ads';
                    return t;
                  });
                  if (names.includes('Designing') && names.includes('Developer') && names.includes('Ads')) return 'All Teams';
                  return names.join(', ') + ' Team';
                }
                if (val === 'design') return 'Designing Team';
                if (val === 'developer') return 'Developer Team';
                if (val === 'ads') return 'Ads Team';
                return val;
              })()}</span></div>
            </div>
          </div>

          {/* Website setup */}
          <div className="p-3.5 bg-gray-50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800/40 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
              <Globe className="w-3.5 h-3.5 text-indigo-500" /> Website Configuration
            </div>
            <div className="grid grid-cols-1 text-xs gap-y-1">
              <div><span className="text-gray-400">URL:</span> <span className="font-mono text-gray-900 dark:text-white">{formValues.websiteUrl || '—'}</span></div>
              <div><span className="text-gray-400">Development Required:</span> <span className="font-semibold text-gray-900 dark:text-white">{formValues.websiteRequired ? 'Yes' : 'No'}</span></div>
              {formValues.websiteRequired && (
                <div><span className="text-gray-400">Website Type:</span> <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formValues.websiteType || '—'}</span></div>
              )}
            </div>
          </div>

          {/* Social credentials protection */}
          <div className="p-3.5 bg-gray-50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800/40 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Social Accounts
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 text-xs gap-x-4 gap-y-1">
              <div>
                <span className="text-gray-400">Facebook:</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formValues.facebookAccountStatus === 'New' 
                    ? 'Create New Account' 
                    : (formValues.facebookId ? `Existing (${formValues.facebookId})` : 'Not Configured')}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Instagram:</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formValues.instagramAccountStatus === 'New' 
                    ? 'Create New Account' 
                    : (formValues.instagramId ? `Existing (${formValues.instagramId})` : 'Not Configured')}
                </span>
              </div>
            </div>
          </div>

          {/* Assets & Channels */}
          <div className="p-3.5 bg-gray-50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800/40 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
              <Layers className="w-3.5 h-3.5 text-indigo-500" /> Assets & Channels
            </div>
            <div className="grid grid-cols-3 text-xs gap-y-1 text-center border-b border-gray-200/50 dark:border-slate-800/40 pb-2 mb-1.5">
              <div><span className="text-gray-400 block mb-0.5">Posters</span> <strong className="text-sm text-gray-900 dark:text-white">{formValues.postersRequired || 0}</strong></div>
              <div><span className="text-gray-400 block mb-0.5">Videos</span> <strong className="text-sm text-gray-900 dark:text-white">{formValues.videosRequired || 0}</strong></div>
              <div><span className="text-gray-400 block mb-0.5">Ads</span> <strong className="text-sm text-gray-900 dark:text-white">{formValues.adsRequired || 0}</strong></div>
            </div>
            <div className="text-xs">
              <span className="text-gray-400">Target Outlets:</span>{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formValues.platforms && formValues.platforms.length > 0
                  ? formValues.platforms.join(', ')
                  : 'No platforms selected'}
              </span>
            </div>
          </div>

          {/* Financials & Dates */}
          <div className="p-3.5 bg-gray-50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800/40 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Plan & Budget
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 text-xs gap-x-4 gap-y-1.5">
              <div><span className="text-gray-400">Plan Amount:</span> <span className="font-bold text-gray-900 dark:text-white">₹{formValues.planAmount || '0'}</span></div>
              <div><span className="text-gray-400">Advance Amount:</span> <span className="font-bold text-gray-900 dark:text-white">₹{formValues.advanceAmount || '0'}</span></div>
              <div><span className="text-gray-400">Pending Amount:</span> <span className="font-bold text-amber-600 dark:text-amber-400">₹{formValues.pendingAmount || '0'}</span></div>
              <div><span className="text-gray-400">Ad Budget:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{formValues.adBudget || '0'}</span></div>
              <div><span className="text-gray-400">Ad Budget Per Day:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{formValues.adBudgetPerDay || '0'}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Colors:</span>
                <span className="font-mono text-gray-900 dark:text-white">{formValues.brandColors || '—'}</span>
                {formValues.brandColors && (
                  <span 
                    className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 inline-block"
                    style={{ backgroundColor: formValues.brandColors }}
                  />
                )}
              </div>
              <div><span className="text-gray-400">Start Date:</span> <span className="text-gray-955 dark:text-white font-medium">{formValues.startDate || '—'}</span></div>
              <div><span className="text-gray-400">Deadline:</span> <span className="text-gray-955 dark:text-white font-medium">{formValues.deliveryDeadline || '—'}</span></div>
              <div className="md:col-span-2"><span className="text-gray-400">Competitors:</span> <span className="text-gray-900 dark:text-white">{formValues.competitors || '—'}</span></div>
              <div className="md:col-span-2 mt-1">
                <span className="text-gray-400 block mb-1">Target Audience ({formValues.targetAudienceRequired || 'Required'}):</span>
                <p className="text-gray-900 dark:text-white bg-white/60 dark:bg-slate-900/40 p-2 rounded border border-gray-250/30 dark:border-slate-800/40">
                  {formValues.targetAudienceRequired === 'Not Required' ? 'Not Required' : (formValues.targetAudience || '—')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="border-t border-gray-150/40 dark:border-slate-800/40 pt-4 flex items-start gap-3.5 p-3.5 rounded-xl border border-dashed border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/2">
        <input
          type="checkbox"
          id="isConfirmed"
          className="w-4.5 h-4.5 rounded-sm border-gray-300 dark:border-slate-700 text-indigo-650 focus:ring-indigo-500 mt-0.5 cursor-pointer"
          {...register('isConfirmed', { required: 'You must confirm these details before saving.' })}
        />
        <label htmlFor="isConfirmed" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          I confirm that all the campaign details and credentials compiled in this brief are verified and correct.
        </label>
      </div>
    </div>
  );
}
