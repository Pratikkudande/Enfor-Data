import React, { useRef, useState } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { externalBrokerApi } from '../../../services/externalBrokerApi';
import { API_CONFIG } from '../../../config/api';

interface UploadResult {
  created: number;
  duplicates: number;
  errors: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: number) => void;
}

const ExternalBrokerUploadModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const res = await externalBrokerApi.uploadExcel(selectedFile);
      setResult(res.data);
      if (res.data.created > 0) onSuccess(res.data.created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const token = localStorage.getItem('enfor_token');
    const url = `${API_CONFIG.BASE_URL}/api/download/external-brokers-sample`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'external_brokers_sample.xlsx';
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upload External Brokers</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Download sample */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <p className="text-sm text-blue-800 mb-2 font-medium">Need a template?</p>
            <p className="text-xs text-blue-600 mb-3">
              Download our Excel template with the correct column headers: <strong>name, mobile_number, area, location, notes</strong>
            </p>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" /> Download Sample
            </button>
          </div>

          {/* File drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
          >
            <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            {selectedFile ? (
              <>
                <p className="text-sm font-medium text-indigo-700">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">Click to select Excel file</p>
                <p className="text-xs text-gray-500 mt-1">.xlsx or .xls files supported</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-800">Upload Complete</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div className="bg-white rounded-lg p-2 border border-green-200">
                  <p className="text-xl font-bold text-green-700">{result.created}</p>
                  <p className="text-xs text-gray-500">Created</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-yellow-200">
                  <p className="text-xl font-bold text-yellow-600">{result.duplicates}</p>
                  <p className="text-xs text-gray-500">Duplicates</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-red-200">
                  <p className="text-xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-xs text-gray-500">Errors</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalBrokerUploadModal;
