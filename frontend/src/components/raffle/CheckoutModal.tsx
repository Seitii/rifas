import { useState } from 'react';
import { Raffle } from '../../types';
import { purchaseApi } from '../../services/raffle.service';
import { formatCurrency, formatNumber } from '../../utils';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  raffle: Raffle;
  selectedNumbers: number[];
  onClose: () => void;
  onSuccess: (whatsappUrl: string) => void;
}

export default function CheckoutModal({
  raffle,
  selectedNumbers,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const totalAmount = selectedNumbers.length * Number(raffle.price_per_number);

  const validate = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!buyerName.trim() || buyerName.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    const phoneClean = buyerPhone.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length < 8) {
      newErrors.phone = 'Telefone inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 0) {
      formatted = cleaned.replace(/^(\d{2})(\d{4,5})(\d{4}).*$/, '($1) $2-$3');
      if (cleaned.length <= 2) formatted = `(${cleaned}`;
      else if (cleaned.length <= 7) formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      else if (cleaned.length <= 10) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
      } else {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
      }
    }
    setBuyerPhone(formatted);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await purchaseApi.reserve({
        raffle_id: raffle.id,
        numbers: selectedNumbers,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.replace(/\D/g, ''),
      });

      if (response.success && response.data) {
        toast.success('Participação confirmada! Redirecionando para o WhatsApp...');
        onSuccess(response.data.whatsappUrl);
      } else {
        toast.error(response.message || 'Erro ao processar participação');
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      if (error.response?.status === 409 && errorData?.data?.conflicted) {
        toast.error(
          `Alguns números já foram reservados: ${errorData.data.conflicted.join(', ')}. Selecione outros.`
        );
        onClose();
      } else {
        toast.error(errorData?.message || 'Erro ao processar participação');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Finalizar Participação</h2>
            <p className="text-sm text-gray-500">{raffle.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Números selecionados */}
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-sm font-medium text-primary-800 mb-2">
              🎟️ {selectedNumbers.length} número(s) selecionado(s):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sortedNumbers.map(n => (
                <span
                  key={n}
                  className="inline-flex items-center px-2 py-0.5 bg-primary-600 text-white rounded text-xs font-mono font-bold"
                >
                  {formatNumber(n, raffle.total_numbers)}
                </span>
              ))}
            </div>
          </div>

          {/* Valor total */}
          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                {selectedNumbers.length} × {formatCurrency(Number(raffle.price_per_number))}
              </p>
              <p className="text-xs text-gray-400">por número</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className="label">Seu nome completo *</label>
              <input
                type="text"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                placeholder="João da Silva"
                className={`input ${errors.name ? 'input-error' : ''}`}
                maxLength={255}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="label">Seu WhatsApp *</label>
              <input
                type="tel"
                value={buyerPhone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="(11) 99999-9999"
                className={`input ${errors.phone ? 'input-error' : ''}`}
                maxLength={15}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              Após confirmar, você será redirecionado para o WhatsApp para finalizar o pagamento. Seus números ficam reservados por 15 minutos.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </span>
              ) : (
                <>Ir para WhatsApp</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
