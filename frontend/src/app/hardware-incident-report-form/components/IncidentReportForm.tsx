'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  MapPin,
  Wrench,
  FileText,
  Camera,
  X,
  Loader2,
  ChevronDown,
  CheckCircle2,
  ImagePlus,
} from 'lucide-react';

interface IncidentFormData {
  equipment: string;
  description: string;
}

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface IncidentReportFormProps {
  onSuccess: () => void;
}

const EQUIPMENT_OPTIONS = [
  { value: 'projector', label: 'Máy chiếu', icon: '📽️' },
  { value: 'ac', label: 'Điều hòa nhiệt độ', icon: '❄️' },
  { value: 'furniture', label: 'Bàn ghế', icon: '🪑' },
  { value: 'whiteboard', label: 'Bảng trắng / Bảng viết', icon: '📋' },
  { value: 'computer', label: 'Máy tính / Màn hình', icon: '💻' },
  { value: 'speaker', label: 'Loa / Âm thanh', icon: '🔊' },
  { value: 'lighting', label: 'Đèn chiếu sáng', icon: '💡' },
  { value: 'door', label: 'Cửa / Khóa phòng', icon: '🚪' },
  { value: 'other', label: 'Thiết bị khác', icon: '🔧' },
];

export default function IncidentReportForm({ onSuccess }: IncidentReportFormProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<IncidentFormData>({ mode: 'onSubmit' });

  const descriptionValue = watch('description') || '';

  const handleEquipmentSelect = (value: string) => {
    setSelectedEquipment(value);
    setValue('equipment', value, { shouldValidate: true });
    setIsSelectOpen(false);
  };

  const selectedOption = EQUIPMENT_OPTIONS.find((o) => o.value === selectedEquipment);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    Array.from(files).forEach((file, idx) => {
      if (file.type.startsWith('image/') && uploadedImages.length + newImages.length < 3) {
        const url = URL.createObjectURL(file);
        newImages.push({
          id: `img-${Date.now()}-${idx}`,
          url,
          name: file.name,
        });
      }
    });
    setUploadedImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const onSubmit = async (data: IncidentFormData) => {
    setIsSubmitting(true);
    // Backend integration point: POST /api/incidents { roomId: 'A3.01', equipmentId: data.equipment, description: data.description, images: uploadedImages }
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    setIsSubmitted(true);
    onSuccess();
    setTimeout(() => {
      setIsSubmitted(false);
      setSelectedEquipment('');
      setUploadedImages([]);
      reset();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-4 pt-4 pb-8 flex flex-col gap-5">
      {/* Room info — read-only */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Phòng học
        </label>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border">
          <MapPin size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-foreground">Phòng A3.01</span>
          <span className="ml-auto">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/12 text-accent text-[11px] font-semibold">
              Đang sử dụng
            </span>
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Phòng được xác định tự động từ đặt chỗ hiện tại của bạn.
        </p>
      </div>

      {/* Equipment select */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Thiết bị gặp sự cố
          <span className="text-error ml-1" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Chọn thiết bị bị hỏng hoặc hoạt động không đúng.
        </p>

        {/* Hidden input for react-hook-form validation */}
        <input
          type="hidden"
          {...register('equipment', { required: 'Vui lòng chọn thiết bị gặp sự cố' })}
        />

        {/* Custom select trigger */}
        <button
          type="button"
          onClick={() => setIsSelectOpen((prev) => !prev)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm
            bg-card text-left transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            ${errors.equipment
              ? 'border-error ring-1 ring-error'
              : isSelectOpen
              ? 'border-primary ring-2 ring-ring' :'border-border hover:border-primary/50'
            }
          `}
          aria-haspopup="listbox"
          aria-expanded={isSelectOpen}
          aria-label="Chọn thiết bị"
        >
          <Wrench size={16} className={`flex-shrink-0 ${selectedEquipment ? 'text-primary' : 'text-muted-foreground'}`} />
          {selectedOption ? (
            <span className="flex-1 font-medium text-foreground">
              <span className="mr-1.5">{selectedOption.icon}</span>
              {selectedOption.label}
            </span>
          ) : (
            <span className="flex-1 text-muted-foreground">Chọn thiết bị...</span>
          )}
          <ChevronDown
            size={16}
            className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isSelectOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {isSelectOpen && (
          <div
            className="
              absolute left-0 right-0 top-full mt-1 z-30
              bg-card border border-border rounded-xl shadow-lg overflow-hidden
            "
            role="listbox"
            aria-label="Danh sách thiết bị"
          >
            <div className="max-h-56 overflow-y-auto py-1">
              {EQUIPMENT_OPTIONS.map((option) => (
                <button
                  key={`equip-${option.value}`}
                  type="button"
                  role="option"
                  aria-selected={selectedEquipment === option.value}
                  onClick={() => handleEquipmentSelect(option.value)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                    transition-colors duration-100
                    ${selectedEquipment === option.value
                      ? 'bg-primary/8 text-primary font-semibold' :'text-foreground hover:bg-secondary'
                    }
                  `}
                >
                  <span className="text-base">{option.icon}</span>
                  <span className="flex-1">{option.label}</span>
                  {selectedEquipment === option.value && (
                    <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Validation error */}
        {errors.equipment && (
          <p className="mt-1.5 text-xs text-error flex items-center gap-1" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-error flex-shrink-0" />
            {errors.equipment.message}
          </p>
        )}
      </div>

      {/* Description textarea */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1.5">
          Mô tả sự cố
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Mô tả càng chi tiết, đội kỹ thuật sẽ xử lý nhanh hơn.
        </p>
        <div className="relative">
          <div className="absolute top-3 left-4 pointer-events-none">
            <FileText size={15} className="text-muted-foreground" />
          </div>
          <textarea
            id="description"
            rows={4}
            placeholder="Mô tả chi tiết lỗi (vd: Máy chiếu bị mờ nhòe hình ảnh, không lấy nét được...)"
            className="
              w-full pl-10 pr-4 py-3 rounded-xl border border-border
              bg-secondary text-sm text-foreground
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-all duration-150 resize-none
            "
            {...register('description')}
          />
          <span className="absolute bottom-2.5 right-3 text-[11px] text-muted-foreground tabular-nums">
            {descriptionValue.length}/500
          </span>
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Đính kèm hình ảnh
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tùy chọn, tối đa 3 ảnh)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Hình ảnh giúp đội kỹ thuật đánh giá mức độ sự cố nhanh hơn.
        </p>

        {/* Image previews */}
        {uploadedImages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {uploadedImages.map((img) => (
              <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Ảnh đính kèm: ${img.name}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="
                    absolute top-1 right-1 w-5 h-5 rounded-full
                    bg-slate-900/70 flex items-center justify-center
                    hover:bg-error transition-colors
                  "
                  aria-label={`Xóa ảnh ${img.name}`}
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        {uploadedImages.length < 3 && (
          <div
            className={`upload-zone rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer ${isDragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileChange(e.dataTransfer.files);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            aria-label="Tải ảnh lên"
          >
            <div className="w-10 h-10 rounded-full bg-primary/8 flex items-center justify-center">
              <ImagePlus size={20} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Thêm hình ảnh</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhấn để chọn hoặc kéo thả ảnh vào đây
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border text-[11px] text-muted-foreground">
                <Camera size={11} />
                JPG, PNG
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary border border-border text-[11px] text-muted-foreground">
                Tối đa 5MB
              </span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          aria-label="Chọn file ảnh"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>

      {/* Priority selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Mức độ nghiêm trọng
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'low', label: 'Thấp', desc: 'Không ảnh hưởng', color: 'text-accent border-accent/30 bg-accent/6' },
            { value: 'medium', label: 'Trung bình', desc: 'Hơi bất tiện', color: 'text-warning border-warning/30 bg-warning/6' },
            { value: 'high', label: 'Cao', desc: 'Không dùng được', color: 'text-error border-error/30 bg-error/6' },
          ].map((level) => {
            const [selected, setSelected] = React.useState(false);
            return null; // handled below
          })}
        </div>
        <PrioritySelector />
      </div>

      {/* Submit button */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={isSubmitting || isSubmitted}
          className={`
            w-full py-4 rounded-xl text-sm font-semibold
            flex items-center justify-center gap-2
            transition-all duration-200 active:scale-[0.98]
            ${isSubmitted
              ? 'bg-accent text-accent-foreground'
              : 'btn-primary'
            }
            disabled:cursor-not-allowed
            ${isSubmitting ? 'opacity-80' : ''}
          `}
          aria-label={isSubmitting ? 'Đang gửi báo cáo' : 'Gửi báo cáo sự cố'}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Đang gửi báo cáo...
            </>
          ) : isSubmitted ? (
            <>
              <CheckCircle2 size={17} />
              Đã gửi thành công!
            </>
          ) : (
            'Gửi báo cáo'
          )}
        </button>
        <p className="text-center text-[11px] text-muted-foreground mt-2.5">
          Đội kỹ thuật sẽ phản hồi trong vòng 2 giờ làm việc
        </p>
      </div>
    </form>
  );
}

// Priority selector as a separate sub-component to avoid hooks-in-loop
function PrioritySelector() {
  const [selected, setSelected] = useState<'low' | 'medium' | 'high'>('medium');

  const levels = [
    { value: 'low' as const, label: 'Thấp', desc: 'Không ảnh hưởng', active: 'border-accent bg-accent/8 text-accent', dot: 'bg-accent' },
    { value: 'medium' as const, label: 'Trung bình', desc: 'Hơi bất tiện', active: 'border-warning bg-warning/8 text-warning', dot: 'bg-warning' },
    { value: 'high' as const, label: 'Cao', desc: 'Không dùng được', active: 'border-error bg-error/8 text-error', dot: 'bg-error' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {levels.map((level) => (
        <button
          key={`priority-${level.value}`}
          type="button"
          onClick={() => setSelected(level.value)}
          className={`
            flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center
            transition-all duration-150 active:scale-[0.97]
            ${selected === level.value
              ? `${level.active} border-2`
              : 'border-border bg-secondary text-muted-foreground hover:border-border/80'
            }
          `}
          aria-pressed={selected === level.value}
          aria-label={`Mức độ ưu tiên: ${level.label}`}
        >
          <div className={`w-2 h-2 rounded-full ${selected === level.value ? level.dot : 'bg-muted-foreground'}`} />
          <span className="text-[12px] font-semibold">{level.label}</span>
          <span className="text-[10px] opacity-75 leading-tight">{level.desc}</span>
        </button>
      ))}
    </div>
  );
}