import React from 'react';
import { Input, Checkbox, TextArea, Select } from '../UI/Input';
import { 
  FileImage, 
  Video, 
  Megaphone, 
  Palette, 
  Flag, 
  DollarSign, 
  CalendarRange,
  Facebook, 
  Instagram, 
  Youtube, 
  Linkedin,
  Chrome,
  Notebook
} from 'lucide-react';

const platformOptions = [
  { id: 'Facebook Ads', name: 'Facebook Ads', icon: Facebook },
  { id: 'Instagram Ads', name: 'Instagram Ads', icon: Instagram },
  { id: 'Google Ads', name: 'Google Ads', icon: Chrome },
  { id: 'YouTube Ads', name: 'YouTube Ads', icon: Youtube },
  { id: 'LinkedIn Ads', name: 'LinkedIn Ads', icon: Linkedin },
];

export default function StepRequirementsBrief({ register, errors, setValue, watch, isClientPortal = false, isReadOnlyProfile = false }) {
  const watchPlatforms = watch('platforms') || [];
  const watchBrandColor = watch('brandColors') || '#6366f1';
  
  const watchPosters = Number(watch('postersRequired') || 0);
  const watchVideos = Number(watch('videosRequired') || 0);
  const watchAds = Number(watch('adsRequired') || 0);
  const watchWebsiteRequired = watch('websiteRequired');

  const watchPostersStatus = watch('postersStatus');
  const watchVideosStatus = watch('videosStatus');
  const watchAdsStatus = watch('adsStatus');
  const watchWebsiteStatus = watch('websiteStatus');

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
            {!isClientPortal && watchPosters > 0 && (
              <div className="space-y-3 border-t border-gray-150/40 dark:border-slate-800/40 pt-3">
                <Select
                  label="Posters Status"
                  placeholder="Select Status"
                  options={statusOptions}
                  error={errors.postersStatus?.message}
                  {...register('postersStatus')}
                />
                {watchPostersStatus === 'In Progress' && (
                  <Input
                    label="Posters Pending Count"
                    type="number"
                    min="0"
                    max={watchPosters}
                    placeholder="Enter pending count"
                    error={errors.postersPending?.message}
                    {...register('postersPending', {
                      min: { value: 0, message: 'Pending count cannot be negative' },
                      max: { value: watchPosters, message: `Pending count cannot exceed required amount (${watchPosters})` }
                    })}
                  />
                )}
              </div>
            )}
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
            {!isClientPortal && watchVideos > 0 && (
              <div className="space-y-3 border-t border-gray-150/40 dark:border-slate-800/40 pt-3">
                <Select
                  label="Videos Status"
                  placeholder="Select Status"
                  options={statusOptions}
                  error={errors.videosStatus?.message}
                  {...register('videosStatus')}
                />
                {watchVideosStatus === 'In Progress' && (
                  <Input
                    label="Videos Pending Count"
                    type="number"
                    min="0"
                    max={watchVideos}
                    placeholder="Enter pending count"
                    error={errors.videosPending?.message}
                    {...register('videosPending', {
                      min: { value: 0, message: 'Pending count cannot be negative' },
                      max: { value: watchVideos, message: `Pending count cannot exceed required amount (${watchVideos})` }
                    })}
                  />
                )}
              </div>
            )}
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
            {!isClientPortal && watchAds > 0 && (
              <div className="space-y-3 border-t border-gray-150/40 dark:border-slate-800/40 pt-3">
                <Select
                  label="Ads Status"
                  placeholder="Select Status"
                  options={statusOptions}
                  error={errors.adsStatus?.message}
                  {...register('adsStatus')}
                />
                {watchAdsStatus === 'In Progress' && (
                  <Input
                    label="Ads Pending Count"
                    type="number"
                    min="0"
                    max={watchAds}
                    placeholder="Enter pending count"
                    error={errors.adsPending?.message}
                    {...register('adsPending', {
                      min: { value: 0, message: 'Pending count cannot be negative' },
                      max: { value: watchAds, message: `Pending count cannot exceed required amount (${watchAds})` }
                    })}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {!isClientPortal && watchWebsiteRequired && (
          <div className="mb-6 p-4 bg-indigo-500/5 dark:bg-indigo-500/2 border border-indigo-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Website Project Status</h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Define development milestone status</p>
            </div>
            <div className="w-full sm:w-48">
              <Select
                placeholder="Select Status"
                options={statusOptions}
                error={errors.websiteStatus?.message}
                {...register('websiteStatus')}
              />
            </div>
          </div>
        )}

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

        <TextArea
          label="Target Audience"
          placeholder="Describe the demographics, behaviors, and core interests of the client's target audience..."
          disabled={isReadOnlyProfile}
          error={errors.targetAudience?.message}
          {...register('targetAudience')}
        />
      </div>

      {/* Financials & Timeline */}
      <div className="space-y-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Campaign Budget & Timeline
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Ad Budget (INR)"
            type="number"
            min="0"
            placeholder="e.g. 5000"
            icon={DollarSign}
            disabled={isReadOnlyProfile}
            error={errors.adBudget?.message}
            {...register('adBudget', { 
              min: { value: 0, message: 'Budget cannot be negative' }
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
    </div>
  );
}
