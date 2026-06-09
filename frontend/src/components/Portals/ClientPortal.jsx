import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Check, 
  Sparkles,
  UserCheck,
  ClipboardList
} from 'lucide-react';

import Card from '../UI/Card';
import Button from '../UI/Button';

// Steps
import StepProfileAccess from '../FormSteps/StepProfileAccess';
import StepRequirementsBrief from '../FormSteps/StepRequirementsBrief';
import StepReviewSubmit from '../FormSteps/StepReviewSubmit';

const STEPS_META = [
  { title: 'Client Profile & Credentials', desc: 'Identify details, contact channels & social logins' },
  { title: 'Campaign Brief & Requirements', desc: 'Deliverables count, targeting networks, creative details & budgets' },
  { title: 'Review & Submit Brief', desc: 'Final review of details and special instructions' }
];

export default function ClientPortal({ salespersonsList = [], onAddLead, onAddNotification }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { 
    register, 
    handleSubmit, 
    trigger, 
    watch, 
    setValue, 
    reset,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      salespersonName: '',
      clientName: '',
      companyName: '',
      businessCategory: '',
      websiteUrl: '',
      websiteRequired: false,
      websiteType: '',
      mobileNumber: '',
      email: '',
      facebookId: '',
      facebookPassword: '',
      instagramId: '',
      instagramPassword: '',
      postersRequired: 0,
      videosRequired: 0,
      adsRequired: 0,
      postersStatus: 'Pending',
      videosStatus: 'Pending',
      adsStatus: 'Pending',
      websiteStatus: 'Pending',
      platforms: [],
      brandColors: '#6366f1',
      targetAudience: '',
      competitors: '',
      adBudget: '',
      startDate: '',
      deliveryDeadline: '',
      notes: ''
    }
  });

  const handleNext = async () => {
    const fieldsToValidate = [
      ['salespersonName', 'clientName', 'websiteUrl', 'websiteRequired', 'websiteType', 'mobileNumber', 'email', 'facebookId', 'facebookPassword', 'instagramId', 'instagramPassword'],
      ['postersRequired', 'videosRequired', 'adsRequired', 'platforms', 'brandColors', 'competitors', 'adBudget', 'startDate', 'deliveryDeadline'],
      ['notes']
    ];

    const isStepValid = await trigger(fieldsToValidate[currentStep]);
    if (isStepValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const onSubmitClient = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        status: 'Client Submitted',
        postersStatus: data.postersStatus || 'Pending',
        videosStatus: data.videosStatus || 'Pending',
        adsStatus: data.adsStatus || 'Pending',
        websiteStatus: data.websiteStatus || 'Pending'
      };

      // Simulate network
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save locally
      onAddLead(payload);
      
      // Trigger notification
      if (onAddNotification) {
        onAddNotification(`New client onboarding brief submitted for ${payload.clientName} and assigned to ${payload.salespersonName}.`, 'submission');
      }
      
      // Confetti feedback
      confetti({
        particleCount: 140,
        spread: 85,
        origin: { y: 0.6 }
      });
      
      setIsSuccess(true);
      reset();
      setCurrentStep(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl p-8 text-center shadow-xl border border-indigo-500/10 space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <Check className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Submitted Successfully!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Thank you for providing your details. Your assigned sales representative will review the onboarding brief and contact you shortly.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800/60 max-w-sm mx-auto flex flex-col gap-2.5">
            <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">
              Assigned Representative
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 py-2 px-4 rounded-xl border border-indigo-500/10">
              <UserCheck className="w-4 h-4" /> {watch('salespersonName') || 'Representative'}
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuccess(false)}
            >
              Submit Another Brief
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <ClipboardList className="w-7 h-7 text-indigo-500" /> Agency Client Briefing Wizard
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
          Please fill out the multi-step form below to specify your marketing assets, budgets, timelines, and credentials.
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-[10%] h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-300"
          style={{ width: `${(currentStep / (STEPS_META.length - 1)) * 80}%` }}
        />
        
        {STEPS_META.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <div key={idx} className="flex flex-col items-center z-10 relative">
              <button
                type="button"
                onClick={() => {
                  if (isCompleted) setCurrentStep(idx);
                }}
                disabled={!isCompleted}
                className={`
                  w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-350 cursor-pointer
                  ${isCompleted 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : isActive 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 border-2 border-indigo-500 ring-4 ring-indigo-500/15 font-extrabold' 
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-slate-850'
                  }
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </button>
              <span className={`text-[10px] font-semibold mt-2 hidden sm:block ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-400'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Wizard Form Card */}
      <Card 
        title={STEPS_META[currentStep].title} 
        subtitle={STEPS_META[currentStep].desc}
      >
        <form onSubmit={handleSubmit(onSubmitClient)} className="space-y-6">
          <div className="relative overflow-hidden min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {currentStep === 0 && (
                  <StepProfileAccess 
                    register={register} 
                    errors={errors} 
                    watch={watch} 
                    isClientPortal={true}
                    salespersonsList={salespersonsList}
                  />
                )}
                {currentStep === 1 && (
                  <StepRequirementsBrief 
                    register={register} 
                    errors={errors} 
                    setValue={setValue} 
                    watch={watch} 
                    isClientPortal={true}
                  />
                )}
                {currentStep === 2 && (
                  <StepReviewSubmit 
                    register={register} 
                    watch={watch} 
                    errors={errors} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex justify-between items-center border-t border-gray-200/50 dark:border-slate-800/50 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              icon={ChevronLeft}
            >
              Previous
            </Button>

            {currentStep < STEPS_META.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                icon={ChevronRight}
                iconPosition="right"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                icon={Send}
              >
                Submit Campaign Brief
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
