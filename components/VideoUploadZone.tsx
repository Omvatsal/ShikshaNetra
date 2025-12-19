"use client";

import { useState, useRef } from "react";
import { Card } from "./Card";

interface VideoUploadZoneProps {
  fileName: string | null;
  subject: string;
  language: string;
  loading: boolean;
  onFileSelect: (file: File) => void;
  onSubjectChange: (subject: string) => void;
  onLanguageChange: (language: string) => void;
  onUpload: () => void;
  onRemoveFile: () => void;
}

export function VideoUploadZone({
  fileName,
  subject,
  language,
  loading,
  onFileSelect,
  onSubjectChange,
  onLanguageChange,
  onUpload,
  onRemoveFile,
}: VideoUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  const subjects = [
    "Data Structures",
    "Algorithms",
    "Machine Learning",
    "Web Development",
    "Python Programming",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Literature",
    "General Teaching",
  ];

  const languages = [
    "English – Indian",
    "English – US",
    "Hindi",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
  ];

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed transition-all cursor-pointer rounded-lg p-12 text-center ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : fileName
              ? "border-green-400 bg-green-50"
              : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleChange}
          className="hidden"
          disabled={loading}
        />

        <div className="space-y-4">
          {fileName ? (
            <>
              <div className="text-5xl">✅</div>
              <div>
                <p className="text-xl font-bold text-green-700">Video Ready!</p>
                <p className="mt-1 text-sm text-green-600">📹 {fileName}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile();
                }}
                className="mx-auto mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                ✕ Remove & choose different video
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl">📹</div>
              <div>
                <p className="text-xl font-bold text-slate-900">Drop your video here</p>
                <p className="mt-1 text-sm text-slate-600">or click to browse</p>
              </div>
              <p className="text-xs text-slate-500">Supported: MP4, MOV, AVI, WebM (Max 500MB)</p>
            </>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      {fileName && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {/* Subject Selection */}
          <Card className="space-y-3 bg-white p-5 border-l-4 border-purple-500">
            <label className="block text-sm font-bold text-slate-900">
              📚 Select Subject
            </label>
            <select
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-900 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-600">Choose the subject or topic of your session</p>
          </Card>

          {/* Language Selection */}
          <Card className="space-y-3 bg-white p-5 border-l-4 border-blue-500">
            <label className="block text-sm font-bold text-slate-900">
              🌐 Select Language
            </label>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-900 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-600">Language used in your teaching session</p>
          </Card>

          {/* Upload Button */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 p-0 overflow-hidden">
            <button
              onClick={onUpload}
              disabled={loading || !fileName}
              className="w-full px-6 py-4 font-bold text-white text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin text-xl">⚙️</span>
                  Processing Your Video...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Start AI Analysis
                </>
              )}
            </button>
          </Card>

          {/* Info Cards */}
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="bg-blue-50 p-4 text-center border-t-2 border-blue-200">
              <p className="text-2xl">⚡</p>
              <p className="mt-1 text-sm font-semibold text-blue-900">2-5 Minutes</p>
              <p className="text-xs text-blue-700">Typical processing time</p>
            </Card>
            <Card className="bg-purple-50 p-4 text-center border-t-2 border-purple-200">
              <p className="text-2xl">🤖</p>
              <p className="mt-1 text-sm font-semibold text-purple-900">AI Analysis</p>
              <p className="text-xs text-purple-700">Video, audio & text analysis</p>
            </Card>
            <Card className="bg-green-50 p-4 text-center border-t-2 border-green-200">
              <p className="text-2xl">💡</p>
              <p className="mt-1 text-sm font-semibold text-green-900">Personal Coach</p>
              <p className="text-xs text-green-700">Detailed feedback & insights</p>
            </Card>
          </div>

          {/* Features List */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 border-l-4 border-indigo-500">
            <p className="text-sm font-bold text-indigo-900 mb-3">✨ What You'll Get:</p>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-center gap-2">
                <span className="text-lg">📊</span> <span>Minute-by-minute performance graphs</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">🔍</span> <span>Audio clarity & confidence scores</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">👁️</span> <span>Video engagement & gesture analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">📝</span> <span>Content accuracy audit</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">🎯</span> <span>Personalized coaching feedback</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">📈</span> <span>Progress tracking & memory</span>
              </li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
