import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input, Select, Checkbox } from '../UI/Input';
import { User, Briefcase, Globe, Phone, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const categories = [
  { value: 'E-commerce', label: 'E-commerce & Retail' },
  { value: 'Real Estate', label: 'Real Estate & Property' },
  { value: 'Health & Wellness', label: 'Health, Medical & Wellness' },
  { value: 'Technology', label: 'Technology & SaaS' },
  { value: 'Education', label: 'Education & Training' },
  { value: 'Food & Beverage', label: 'Food & Restaurant' },
  { value: 'Automotive', label: 'Automotive & Logistics' },
  { value: 'Finance & Legal', label: 'Finance & Legal' },
  { value: 'Entertainment & Media', label: 'Entertainment & Media' },
  { value: 'Other', label: 'Other Business Sectors' },
];

export default function StepProfileAccess({ register, errors, watch, isClientPortal = false, salespersonsList = [], isReadOnlyProfile = false }) {
  const [showFbPass, setShowFbPass] = useState(false);
  const [showIgPass, setShowIgPass] = useState(false);
  const watchWebsiteRequired = watch('websiteRequired');
  
  const salespersonOptions = salespersonsList.map(name => ({ value: name, label: name }));

  return (
    <div className="space-y-6">
      {/* Salesperson Identity */}
      <div className="bg-indigo-500/5 dark:bg-indigo-500/2 border border-indigo-500/10 p-4 rounded-xl">
        {isClientPortal ? (
          <Select
            label="Assigned Sales Representative"
            placeholder="Select the representative you are working with"
            required
            disabled={isReadOnlyProfile}
            options={salespersonOptions}
            error={errors.salespersonName?.message}
            {...register('salespersonName', { required: 'Representative assignment is required' })}
          />
        ) : (
          <Input
            label="Salesperson Name (Active Profile)"
            required
            readOnly
            icon={User}
            className="opacity-75"
            error={errors.salespersonName?.message}
            {...register('salespersonName', { required: 'Salesperson Name is required' })}
          />
        )}
      </div>

      {/* Client Identity & Contacts */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Client Identity & Contact Details
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Client Name"
            placeholder="Client contact person"
            required
            disabled={isReadOnlyProfile}
            icon={User}
            error={errors.clientName?.message}
            {...register('clientName', { required: 'Client Name is required' })}
          />

          <Input
            label="Company Name"
            placeholder="Client company name"
            disabled={isReadOnlyProfile}
            icon={Briefcase}
            error={errors.companyName?.message}
            {...register('companyName')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Mobile Number"
            placeholder="+91 9876543210"
            required
            disabled={isReadOnlyProfile}
            icon={Phone}
            error={errors.mobileNumber?.message}
            {...register('mobileNumber', { 
              required: 'Mobile Number is required',
              pattern: {
                value: /^[\d\s\+\-\(\)]{7,20}$/,
                message: 'Please enter a valid phone number'
              }
            })}
          />

          <Input
            label="Email Address"
            placeholder="client@company.com"
            type="email"
            disabled={isReadOnlyProfile}
            icon={Mail}
            error={errors.email?.message}
            {...register('email', { 
              required: 'Email Address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
        </div>
      </div>

      {/* Business Category & Website Info */}
      <div className="space-y-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Business Details & Website Setup
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Business Category"
            placeholder="Select category"
            disabled={isReadOnlyProfile}
            options={categories}
            error={errors.businessCategory?.message}
            {...register('businessCategory')}
          />

          <Input
            label="Website URL"
            placeholder="e.g. https://www.clientwebsite.com"
            disabled={isReadOnlyProfile}
            icon={Globe}
            error={errors.websiteUrl?.message}
            {...register('websiteUrl', {
              pattern: {
                value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
                message: 'Please enter a valid website URL'
              }
            })}
          />
        </div>

        {/* Website Required Switch */}
        <div className="bg-slate-500/5 dark:bg-slate-500/2 border border-slate-200/50 dark:border-slate-800/50 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Does this client require a new website?</h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Toggle if website development is part of our deliverables.</p>
          </div>
          <Checkbox
            label="Yes, Required"
            disabled={isReadOnlyProfile}
            checked={watchWebsiteRequired}
            {...register('websiteRequired')}
            className="!p-2.5 !border-0 bg-transparent"
          />
        </div>

        {/* Website Type Input */}
        {watchWebsiteRequired && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Input
              label="Type of Website Required"
              placeholder="e.g. E-commerce store, landing page, corporate website"
              required
              disabled={isReadOnlyProfile}
              icon={Globe}
              error={errors.websiteType?.message}
              {...register('websiteType', { 
                required: watchWebsiteRequired ? 'Please specify what type of website is required' : false 
              })}
            />
          </motion.div>
        )}
      </div>

      {/* Social Page Credentials */}
      <div className="space-y-4 border-t border-gray-150/40 dark:border-slate-800/40 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Social Media Page Credentials
          </h4>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/10 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" /> SSL Secured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Facebook */}
          <div className="bg-indigo-500/3 dark:bg-indigo-500/1 border border-indigo-500/5 p-4 rounded-xl space-y-3">
            <h5 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Facebook Access
            </h5>
            
            <Input
              label="Facebook ID / Email"
              placeholder="Facebook identifier"
              disabled={isReadOnlyProfile}
              error={errors.facebookId?.message}
              {...register('facebookId')}
            />

            <div className="relative">
              <Input
                label="Facebook Password"
                placeholder="••••••••"
                disabled={isReadOnlyProfile}
                type={showFbPass ? 'text' : 'password'}
                error={errors.facebookPassword?.message}
                {...register('facebookPassword')}
              />
              <button
                type="button"
                onClick={() => setShowFbPass(!showFbPass)}
                disabled={isReadOnlyProfile}
                className="absolute right-3.5 top-[34px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                {showFbPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Instagram */}
          <div className="bg-indigo-500/3 dark:bg-indigo-500/1 border border-indigo-500/5 p-4 rounded-xl space-y-3">
            <h5 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Instagram Access
            </h5>
            
            <Input
              label="Instagram ID / Username"
              placeholder="@username"
              disabled={isReadOnlyProfile}
              error={errors.instagramId?.message}
              {...register('instagramId')}
            />

            <div className="relative">
              <Input
                label="Instagram Password"
                placeholder="••••••••"
                disabled={isReadOnlyProfile}
                type={showIgPass ? 'text' : 'password'}
                error={errors.instagramPassword?.message}
                {...register('instagramPassword')}
              />
              <button
                type="button"
                onClick={() => setShowIgPass(!showIgPass)}
                disabled={isReadOnlyProfile}
                className="absolute right-3.5 top-[34px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                {showIgPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
