import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { raffleApi } from '../../services/raffle.service';
import { formatCurrency } from '../../utils';
import toast from 'react-hot-toast';

export default function AdminCreateRafflePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    draw_date: '',
    total_numbers: '',
    price_per_number: '',
    whatsapp_number: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const maxFiles = 5;
    const accepted: File[] = [];
    for (const file of files.slice(0, maxFiles)) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); continue; }
      accepted.push(file);
      const reader = new FileReader();
      reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    }
    setImages(prev => [...prev, ...accepted].slice(0, maxFiles));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim() || form.title.trim().length < 3) newErrors.title = 'Título deve ter pelo menos 3 caracteres';
    if (!form.description.trim() || form.description.trim().length < 10) newErrors.description = 'Descrição deve ter pelo menos 10 caracteres';
    if (!form.draw_date) newErrors.draw_date = 'Data do sorteio é obrigatória';
    else if (new Date(form.draw_date) <= new Date()) newErrors.draw_date = 'Data deve ser futura';
    const totalNums = parseInt(form.total_numbers);
    if (!form.total_numbers || isNaN(totalNums) || totalNums < 1 || totalNums > 100000)
      newErrors.total_numbers = 'Total deve ser entre 1 e 100.000';
    const price = parseFloat(form.price_per_number);
    if (!form.price_per_number || isNaN(price) || price <= 0)
      newErrors.price_per_number = 'Preço deve ser maior que zero';
    if (!form.whatsapp_number.trim()) newErrors.whatsapp_number = 'Número do WhatsApp é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error('Corrija os erros antes de continuar'); return; }
    setIsSubmitting(true);
    try {
      const res = await raffleApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        draw_date: new Date(form.draw_date).toISOString(),
        total_numbers: parseInt(form.total_numbers),
        price_per_number: parseFloat(form.price_per_number),
        whatsapp_number: form.whatsapp_number.trim(),
        images: images.length > 0 ? images : undefined,
      });
      if (res.success && res.data) {
        toast.success('Rifa criada com sucesso! 🎟️');
        navigate(`/admin/rifas/${res.data.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar rifa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedRevenue = parseInt(form.total_numbers) * parseFloat(form.price_per_number) || 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/rifas')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">←</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Rifa</h1>
          <p className="text-gray-500 text-sm">Preencha os dados abaixo para criar uma nova rifa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Imagem */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">📸 Imagem da Rifa</h2>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            {imagePreviews.length > 0 ? (
              <div className="flex gap-2 flex-wrap justify-center">
                {imagePreviews.map((p, idx) => (
                  <div key={idx} className="w-32 h-20 overflow-hidden rounded-lg">
                    <img src={p} alt={`Preview ${idx+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-2">📷</p>
                <p className="text-gray-600 font-medium">Clique para selecionar uma imagem</p>
                <p className="text-gray-400 text-xs mt-1">JPEG, PNG, WebP ou GIF • máx. 5MB</p>
              </div>
            )}
          </div>
          {imagePreviews.length > 0 && (
            <button type="button" onClick={() => { setImages([]); setImagePreviews([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="mt-2 text-sm text-red-500 hover:underline">Remover imagens</button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" multiple />
        </div>

        {/* Dados básicos */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">📋 Informações da Rifa</h2>

          <div>
            <label className="label">Título *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Ex: Rifa do iPhone 15 Pro" className={`input ${errors.title ? 'input-error' : ''}`} maxLength={500} />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="label">Descrição *</label>
            <textarea name="description" value={form.description} onChange={handleChange as any}
              placeholder="Descreva o prêmio, regras do sorteio e outras informações importantes..."
              className={`input min-h-[100px] resize-y ${errors.description ? 'input-error' : ''}`} maxLength={5000} />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          <div>
            <label className="label">Data do Sorteio *</label>
            <input type="datetime-local" name="draw_date" value={form.draw_date} onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              className={`input ${errors.draw_date ? 'input-error' : ''}`} />
            {errors.draw_date && <p className="mt-1 text-xs text-red-500">{errors.draw_date}</p>}
          </div>
        </div>

        {/* Configurações numéricas */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">🔢 Configurações</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Total de Números *</label>
              <input type="number" name="total_numbers" value={form.total_numbers} onChange={handleChange}
                placeholder="100" min="1" max="100000"
                className={`input ${errors.total_numbers ? 'input-error' : ''}`} />
              {errors.total_numbers
                ? <p className="mt-1 text-xs text-red-500">{errors.total_numbers}</p>
                : <p className="mt-1 text-xs text-gray-400">Mínimo: 1 • Máximo: 100.000</p>}
            </div>

            <div>
              <label className="label">Preço por Número (R$) *</label>
              <input type="number" name="price_per_number" value={form.price_per_number} onChange={handleChange}
                placeholder="10.00" min="0.01" step="0.01"
                className={`input ${errors.price_per_number ? 'input-error' : ''}`} />
              {errors.price_per_number && <p className="mt-1 text-xs text-red-500">{errors.price_per_number}</p>}
            </div>
          </div>

          {estimatedRevenue > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <p className="text-sm text-green-700">
                💰 Receita potencial (100% vendido):{' '}
                <span className="font-bold">{formatCurrency(estimatedRevenue)}</span>
              </p>
            </div>
          )}

          <div>
            <label className="label">Número do WhatsApp (com DDD e código do país) *</label>
            <input name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange}
              placeholder="5511999999999"
              className={`input ${errors.whatsapp_number ? 'input-error' : ''}`} />
            {errors.whatsapp_number
              ? <p className="mt-1 text-xs text-red-500">{errors.whatsapp_number}</p>
              : <p className="mt-1 text-xs text-gray-400">Ex: 5511999999999 (Brasil + DDD + número)</p>}
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/rifas')} className="btn-secondary flex-1" disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 btn-lg">
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando rifa...
              </span>
            ) : '🎟️ Criar Rifa'}
          </button>
        </div>
      </form>
    </div>
  );
}
