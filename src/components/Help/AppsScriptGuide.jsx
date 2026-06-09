import React, { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { Copy, Check, FileCode, Play, ExternalLink, X } from 'lucide-react';

export const googleAppsScriptCode = `/**
 * Google Apps Script - Marketing Lead Collection Web App
 * 
 * Instructions:
 * 1. Open Google Sheets.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Click the Save icon.
 * 5. Click "Deploy" -> "New deployment".
 * 6. Select Type: "Web app".
 * 7. Set Description: "Lead Collection API".
 * 8. Set Execute as: "Me (your-email@gmail.com)".
 * 9. Set Who has access: "Anyone".
 * 10. Click "Deploy", authorize permissions, and copy the Web App URL.
 */

function doPost(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create headers if the sheet is empty
    if (sheet.getLastRow() === 0) {
      var headerRow = [
        "Timestamp", "Salesperson Name", "Client Name", "Mobile Number", "Email",
        "Company Name", "Business Category", "Website URL", "Website Required", "Website Type", 
        "Facebook ID/Username", "Facebook Password", "Instagram ID/Username", "Instagram Password",
        "Posters (Total/Pending/Completed)", "Videos (Total/Pending/Completed)", 
        "Ads (Total/Pending/Completed)", "Website Status", "Selected Platforms",
        "Brand Colors", "Target Audience", "Competitors", "Ad Budget", "Start Date",
        "Delivery Deadline", "Total Count", "Pending Count", "Completed Count", "Notes"
      ];
      sheet.appendRow(headerRow);
      sheet.getRange(1, 1, 1, headerRow.length).setFontWeight("bold").setBackground("#e0e7ff");
    }
    
    // Format values for sheet row
    var rowData = [
      data.timestamp || new Date().toISOString(),
      data.salespersonName || "",
      data.clientName || "",
      data.mobileNumber || "",
      data.email || "",
      data.companyName || "",
      data.businessCategory || "",
      data.websiteUrl || "",
      data.websiteRequired ? "Yes" : "No",
      data.websiteType || "",
      data.facebookId || "",
      data.facebookPassword || "",
      data.instagramId || "",
      data.instagramPassword || "",
      data.postersSummary || "Total: 0 | Pending: 0 | Completed: 0",
      data.videosSummary || "Total: 0 | Pending: 0 | Completed: 0",
      data.adsSummary || "Total: 0 | Pending: 0 | Completed: 0",
      data.websiteStatus || "Pending",
      data.platforms ? data.platforms.join(", ") : "",
      data.brandColors || "",
      data.targetAudience || "",
      data.competitors || "",
      data.adBudget || "",
      data.startDate || "",
      data.deliveryDeadline || "",
      Number(data.totalPostsCount) || 0,
      Number(data.pendingPostsCount) || 0,
      Number(data.completedPostsCount) || 0,
      data.notes || ""
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "Lead added successfully!" 
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle preflight OPTIONS requests for CORS
function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return HtmlService.createHtmlOutput("")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
`;

export default function AppsScriptGuide({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Google Sheets Integration Assistant</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Connect your leads web app to spreadsheets without a backend</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-600 dark:text-gray-300">
          
          {/* Steps */}
          <div>
            <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3.5">
              Deployment Guide
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-950/20 rounded-xl border border-gray-100 dark:border-slate-800/40 flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">1</span>
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white">Create Script</h5>
                  <p className="text-xs text-gray-500 mt-1">Open Google Sheet, go to Extensions → Apps Script. Clear placeholder code.</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-950/20 rounded-xl border border-gray-100 dark:border-slate-800/40 flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">2</span>
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white">Paste & Deploy</h5>
                  <p className="text-xs text-gray-500 mt-1">Paste code. Click Deploy → New deployment. Set type to 'Web App'. Access: 'Anyone'.</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-950/20 rounded-xl border border-gray-100 dark:border-slate-800/40 flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">3</span>
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white">Paste URL Here</h5>
                  <p className="text-xs text-gray-500 mt-1">Copy the Deployment Web App URL. Paste it in the setting input above the form.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Code Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Apps Script Template Code
              </h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                icon={copied ? Check : Copy}
                className={copied ? "!text-emerald-500 !border-emerald-500/20" : ""}
              >
                {copied ? 'Copied!' : 'Copy Script Code'}
              </Button>
            </div>
            
            <div className="relative rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
              <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[280px]">
                {googleAppsScriptCode}
              </pre>
            </div>
          </div>

          {/* Integration Notes */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-400 flex items-start gap-3">
            <Play className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong className="font-semibold block mb-0.5">Authorization Permission Popup:</strong>
              When deploying, Google will ask to authorize permissions to access Google Sheets on your account. Click "Advanced" → "Go to Untitled Project (unsafe)" to grant permission. Since you are the sole author of this script, this is completely safe!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/30 flex justify-end">
          <Button onClick={onClose} variant="primary" size="sm">
            Ready, Close Modal
          </Button>
        </div>
      </div>
    </div>
  );
}
