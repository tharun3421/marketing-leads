import React from 'react';
import { Input, Checkbox, TextArea, Select } from '../UI/Input';
import { motion } from 'framer-motion';
import { 
  FileImage, 
  Video, 
  Megaphone, 
  Palette, 
  Flag,  
  CalendarRange,
  Youtube, 
  Linkedin,
  Chrome,
  Notebook,
  IndianRupeeIcon,
  Infinity,
  MapPin,
  TrendingUp
} from 'lucide-react';

const platformOptions = [
  { id: 'Meta Ads', name: 'Meta Ads', icon: Infinity },
  { id: 'Google Ads', name: 'Google Ads', icon: Chrome },
  { id: 'YouTube Ads', name: 'YouTube Ads', icon: Youtube },
  { id: 'LinkedIn Ads', name: 'LinkedIn Ads', icon: Linkedin },
  { id: 'GMB', name: 'GMB', icon: MapPin },
  { id: 'SEO', name: 'SEO', icon: TrendingUp },
];  

export default function StepRequirementsBrief({ register, errors, setValue, watch, isClientPortal = false, isReadOnlyProfile = false }) {
  const watchPlatforms = watch('platforms') || [];
  const watchTargetAudienceRequired = watch('targetAudienceRequired') || 'Required';
  const watchBrandColor = watch('brandColors') || '#6366f1';
  
  const watchPosters = Number(watch('postersRequired') || 0);
  const watchVideos = Number(watch('videosRequired') || 0);
  const watchAds = Number(watch('adsRequired') || 0);
  const watchWebsiteRequired = watch('websiteRequired');

  const watchPostersStatus = watch('postersStatus');
  const watchVideosStatus = watch('videosStatus');
  const watchAdsStatus = watch('adsStatus');
  const watchWebsiteStatus = watch('websiteStatus');

  const watchPlanAmount = Number(watch('planAmount') || 0);
  const watchAdvanceAmount = Number(watch('advanceAmount') || 0);

  React.useEffect(() => {
    const calculatedPending = Math.max(0, watchPlanAmount - watchAdvanceAmount);
    setValue('pendingAmount', calculatedPending);
  }, [watchPlanAmount, watchAdvanceAmount, setValue]);

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' }
  ];

  return (
    <div className="space-y-6">
      {/* Marketing Material Quantities */}
      <div>
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3.5">
          Marketing Assets & Channels
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          {/* Posters Block */}
          <div className="space-y-3 p-4 bg-slate-500/5 dark:bg-slate-500/2 border border-gray-100 dark:border-slate-800/60 rounded-2xl">
            <Input
              label="Posters Required"
              type="number"
              min="0"
              placeholder="0"
              icon={FileImage}
              disabled={isReadOnlyProfile}
              error={errors.postersRequired?.message}
              {...register('postersRequired', { 
                min: { value: 0, message: 'Quantity cannot be negative' }
              })}
            />
          </div>

          {/* Videos Block */}
          <div className="space-y-3 p-4 bg-slate-500/5 dark:bg-slate-500/2 border border-gray-100 dark:border-slate-800/60 rounded-2xl">
            <Input
              label="Videos Required"
              type="number"
              min="0"
              placeholder="0"
              icon={Video}
              disabled={isReadOnlyProfile}
              error={errors.videosRequired?.message}
              {...register('videosRequired', { 
                min: { value: 0, message: 'Quantity cannot be negative' }
              })}
            />
          </div>

          {/* Ads Block */}
          <div className="space-y-3 p-4 bg-slate-500/5 dark:bg-slate-500/2 border border-gray-100 dark:border-slate-800/60 rounded-2xl">
            <Input
              label="Advertisements Required"
              type="number"
              min="0"
              placeholder="0"
              icon={Megaphone}
              disabled={isReadOnlyProfile}
              error={errors.adsRequired?.message}
              {...register('adsRequired', { 
                min: { value: 0, message: 'Quantity cannot be negative' }
              })}
            />
          </div>
        </div>

        {/* Channels */}
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
          Target Platforms
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platformOptions.map((platform) => (
            <Checkbox
              key={platform.id}
              label={platform.name}
              icon={platform.icon}
              value={platform.id}
              disabled={isReadOnlyProfile}
              checked={watchPlatforms.includes(platform.id)}
              {...register('platforms')}
            />
          ))}
        </div>
      </div>

      {/* Brand Identity & Competitors */}
      <div className="space-y-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Creative Brief & Branding
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-2.5 items-end">
            <Input
              label="Brand Colors"
              placeholder="e.g. #6366f1, #a855f7"
              icon={Palette}
              disabled={isReadOnlyProfile}
              className="flex-1"
              error={errors.brandColors?.message}
              {...register('brandColors')}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 text-center">Picker</span>
              <input
                type="color"
                disabled={isReadOnlyProfile}
                className="w-11 h-11 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-1 cursor-pointer transition-all outline-hidden hover:scale-105"
                onChange={(e) => setValue('brandColors', e.target.value)}
                value={watchBrandColor.startsWith('#') && watchBrandColor.length === 7 ? watchBrandColor : '#6366f1'}
              />
            </div>
          </div>

          <Input
            label="Competitor Names"
            placeholder="e.g. Competitor A, Competitor B"
            icon={Flag}
            disabled={isReadOnlyProfile}
            error={errors.competitors?.message}
            {...register('competitors')}
          />
        </div>

        <Select
          label="Target Audience"
          disabled={isReadOnlyProfile}
          options={[
            { value: 'Required', label: 'Required' },
            { value: 'Not Required', label: 'Not Required' }
          ]}
          {...register('targetAudienceRequired')}
        />

        {watchTargetAudienceRequired === 'Required' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <TextArea
              label="Target Audience Description"
              placeholder="Describe the demographics, behaviors, and core interests of the client's target audience..."
              required={watchTargetAudienceRequired === 'Required'}
              disabled={isReadOnlyProfile}
              error={errors.targetAudience?.message}
              {...register('targetAudience', {
                required: watchTargetAudienceRequired === 'Required' ? 'Target audience description is required' : false
              })}
            />
          </motion.div>
        )}
      </div>

      {/* Financials & Timeline */}
      <div className="space-y-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Campaign Budget & Timeline
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Plan Amount (INR)"
            type="number"
            min="0"
            placeholder="e.g. 15000"
            icon={IndianRupeeIcon}
            disabled={isReadOnlyProfile}
            error={errors.planAmount?.message}
            {...register('planAmount', { 
              min: { value: 0, message: 'Plan Amount cannot be negative' }
            })}
          />

          <Input
            label="Advance Amount (INR)"
            type="number"
            min="0"
            placeholder="e.g. 5000"
            icon={IndianRupeeIcon}
            disabled={isReadOnlyProfile}
            error={errors.advanceAmount?.message}
            {...register('advanceAmount', { 
              min: { value: 0, message: 'Advance Amount cannot be negative' }
            })}
          />

          <Input
            label="Pending Amount (INR)"
            type="number"
            min="0"
            placeholder="Auto-calculated"
            icon={IndianRupeeIcon}
            readOnly
            className="opacity-75"
            error={errors.pendingAmount?.message}
            {...register('pendingAmount')}
          />


          <Input
            label="Ad Budget Per Day (INR)"
            type="number"
            min="0"
            placeholder="e.g. 500"
            icon={IndianRupeeIcon}
            disabled={isReadOnlyProfile}
            error={errors.adBudgetPerDay?.message}
            {...register('adBudgetPerDay', { 
              min: { value: 0, message: 'Budget per day cannot be negative' }
            })}
          />

          <Input
            label="Project Start Date"
            type="date"
            icon={CalendarRange}
            disabled={isReadOnlyProfile}
            error={errors.startDate?.message}
            {...register('startDate')}
          />

          <Input
            label="Delivery Deadline"
            type="date"
            icon={CalendarRange}
            disabled={isReadOnlyProfile}
            error={errors.deliveryDeadline?.message}
            {...register('deliveryDeadline')}
          />
        </div>
      </div>

      {/* Special Notes (moved from step 3) */}
      <div className="space-y-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Campaign Special Notes
        </h4>
        <TextArea
          label="Notes / Special Instructions"
          placeholder="Enter any specific requests, references, content constraints, or special notes..."
          disabled={isReadOnlyProfile}
          error={errors.notes?.message}
          icon={Notebook}
          {...register('notes')}
        />
      </div>
    </div>
  );
}
