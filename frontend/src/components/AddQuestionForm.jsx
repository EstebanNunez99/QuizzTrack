import { useState, useEffect } from 'react';
import { Plus, Check, X, Trash2, ArrowRight, Image as ImageIcon } from 'lucide-react';

export default function AddQuestionForm({ quizId, token, onAdded, initialData, onCancel }) {
  const [type, setType] = useState('MULTIPLE_CHOICE');
  const [text, setText] = useState('');
  const [points, setPoints] = useState(5);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [options, setOptions] = useState([{ text: '', isCorrect: false, matchCorrect: '', isDistractor: false, imageUrl: null, imageFile: null }, { text: '', isCorrect: false, matchCorrect: '', isDistractor: false, imageUrl: null, imageFile: null }]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setText(initialData.text);
      setPoints(initialData.points || 1);
      setImageUrl(initialData.imageUrl || null);
      if (initialData.type === 'MULTIPLE_CHOICE') {
        setOptions(initialData.options.map(o => ({ text: o.text, isCorrect: o.isCorrect, matchCorrect: '', imageUrl: o.imageUrl || null, imageFile: null })));
      } else if (initialData.type === 'TRUE_FALSE') {
        setOptions(initialData.options.map(o => ({ text: o.text, isCorrect: o.isCorrect, matchCorrect: '', imageUrl: o.imageUrl || null, imageFile: null })));
      } else if (initialData.type === 'MATCHING') {
        setOptions(initialData.options.map(o => ({
          text: o.text,
          isCorrect: true,
          matchCorrect: o.matchCorrect || '',
          isDistractor: o.text === '',
          imageUrl: o.imageUrl || null,
          imageFile: null
        })));
      }
    }
  }, [initialData]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Subir imagen de la pregunta si existe
    let finalImageUrl = imageUrl;
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) finalImageUrl = uploadedUrl;
    }

    // Subir imágenes de las opciones
    let tempOptions = [...options];
    for (let i = 0; i < tempOptions.length; i++) {
      if (tempOptions[i].imageFile) {
        const uploadedOptUrl = await uploadImage(tempOptions[i].imageFile);
        if (uploadedOptUrl) tempOptions[i].imageUrl = uploadedOptUrl;
      }
    }

    let finalOptions = [];
    if (type === 'MULTIPLE_CHOICE') {
      finalOptions = tempOptions.map(o => ({ text: o.text, isCorrect: o.isCorrect, imageUrl: o.imageUrl }));
    } else if (type === 'MATCHING') {
      finalOptions = tempOptions.map(o => ({ text: o.text, isCorrect: true, matchCorrect: o.matchCorrect, imageUrl: o.imageUrl }));
    } else if (type === 'TRUE_FALSE') {
      if (tempOptions.length !== 2 || !tempOptions[0].text) {
        finalOptions = [
          { text: 'Verdadero', isCorrect: true, imageUrl: null },
          { text: 'Falso', isCorrect: false, imageUrl: null }
        ];
      } else {
        finalOptions = tempOptions.map(o => ({ text: o.text, isCorrect: o.isCorrect, imageUrl: o.imageUrl }));
      }
    } else if (type === 'TEXT') {
      finalOptions = [];
    }

    const url = initialData
      ? `${API_URL}/quizzes/questions/${initialData.id}`
      : `${API_URL}/quizzes/${quizId}/questions`;
    const method = initialData ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ type, text, points, imageUrl: finalImageUrl, options: finalOptions })
    });

    if (res.ok) {
      if (!initialData) {
        setText('');
        setPoints(1);
        setImageUrl(null);
        setImageFile(null);
        setOptions([{ text: '', isCorrect: false, matchCorrect: '', imageUrl: null, imageFile: null }, { text: '', isCorrect: false, matchCorrect: '', imageUrl: null, imageFile: null }]);
      }
      onAdded();
    }
  };

  const removeOption = (indexToRemove) => {
    setOptions(options.filter((_, idx) => idx !== indexToRemove));
  };

  const handleQuestionImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageUrl(URL.createObjectURL(e.target.files[0])); // preview
    }
  };

  const handleOptionImageChange = (i, e) => {
    if (e.target.files && e.target.files[0]) {
      const newOpts = [...options];
      newOpts[i].imageFile = e.target.files[0];
      newOpts[i].imageUrl = URL.createObjectURL(e.target.files[0]); // preview
      setOptions(newOpts);
    }
  };

  return (
    <div className={`bg-white border ${initialData ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-zinc-200 shadow-sm'} rounded-2xl p-6 sm:p-8 mt-8`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${initialData ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-900'} flex items-center justify-center`}>
            {initialData ? <Check size={16} /> : <Plus size={16} />}
          </div>
          <h4 className="text-lg font-bold text-zinc-900">{initialData ? 'Editar Pregunta' : 'Añadir Nueva Pregunta'}</h4>
        </div>
        {initialData && onCancel && (
          <button onClick={onCancel} type="button" className="text-zinc-400 hover:text-zinc-700 p-1">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tipo de Pregunta</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                if (e.target.value === 'MULTIPLE_CHOICE' && options.length < 2) {
                  setOptions([{ text: '', isCorrect: false, matchCorrect: '', imageUrl: null, imageFile: null }, { text: '', isCorrect: false, matchCorrect: '', imageUrl: null, imageFile: null }]);
                } else if (e.target.value === 'MATCHING' && options.length < 2) {
                  setOptions([{ text: '', isCorrect: true, matchCorrect: '', imageUrl: null, imageFile: null }, { text: '', isCorrect: true, matchCorrect: '', imageUrl: null, imageFile: null }]);
                }
              }}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
              disabled={!!initialData}
            >
              <option value="MULTIPLE_CHOICE">Opción Múltiple / Checkboxes</option>
              <option value="TRUE_FALSE">Verdadero / Falso</option>
              <option value="MATCHING">Relacionar Conceptos (Match)</option>
              <option value="TEXT">Desarrollo (Texto Libre)</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Enunciado</label>
              <textarea
                placeholder="Escribe la pregunta aquí..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm min-h-[44px] resize-y placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Imagen Adjunta (Opcional)</label>
              <div className="flex items-center gap-4">
                {imageUrl && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden border border-zinc-200">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageUrl(null); setImageFile(null); }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-md text-sm cursor-pointer hover:bg-zinc-200 transition-colors border border-zinc-200">
                  <ImageIcon size={16} /> Subir Imagen
                  <input type="file" accept="image/*" onChange={handleQuestionImageChange} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Puntos totales de la pregunta</label>
              <input
                type="number" step="0.1" required
                value={points} onChange={e => setPoints(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
              />
              <p className="text-xs text-zinc-500 mt-1">El descuento por error se calcula automáticamente (resta exactamente el mismo valor que otorga una opción correcta).</p>
            </div>
          </div>
        </div>

        {type === 'MULTIPLE_CHOICE' && (
          <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-5 space-y-3">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Opciones de Respuesta</label>
            {options.map((opt, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 border border-zinc-200 rounded-lg">
                <span className="text-xs font-semibold text-zinc-400 uppercase w-6">{(i + 1).toString().padStart(2, '0')}</span>

                <div className="flex-1 flex items-center gap-2 w-full">
                  {opt.imageUrl ? (
                    <div className="relative w-10 h-10 flex-shrink-0 rounded-md overflow-hidden border border-zinc-200">
                      <img src={opt.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { const newOpts = [...options]; newOpts[i].imageUrl = null; newOpts[i].imageFile = null; setOptions(newOpts); }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-zinc-100 text-zinc-500 rounded-md cursor-pointer hover:bg-zinc-200 transition-colors border border-zinc-200" title="Añadir imagen a opción">
                      <ImageIcon size={16} />
                      <input type="file" accept="image/*" onChange={(e) => handleOptionImageChange(i, e)} className="hidden" />
                    </label>
                  )}
                  <input
                    value={opt.text}
                    placeholder={`Opción ${i + 1}`}
                    onChange={e => {
                      const newOpts = [...options];
                      newOpts[i].text = e.target.value;
                      setOptions(newOpts);
                    }}
                    required
                    className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer bg-zinc-50 px-3 py-2 border border-zinc-200 rounded-md hover:bg-zinc-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={e => {
                        const newOpts = [...options];
                        newOpts[i].isCorrect = e.target.checked;
                        setOptions(newOpts);
                      }}
                      className="w-4 h-4 rounded border-zinc-300 text-green-600 focus:ring-green-600 cursor-pointer"
                    />
                    Es correcta
                  </label>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-md transition-all"
                      title="Borrar opción"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setOptions([...options, { text: '', isCorrect: false, matchCorrect: '', imageUrl: null, imageFile: null }])}
              className="mt-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 px-8"
            >
              <Plus size={14} /> Añadir otra opción
            </button>
          </div>
        )}

        {type === 'MATCHING' && (
          <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-5 space-y-3">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Pares a Relacionar y Distractores</label>
            {options.map((opt, i) => (
              <div key={i} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border ${opt.isDistractor ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-zinc-200'}`}>

                {opt.isDistractor ? (
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider w-24">Distractor</span>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-zinc-400 uppercase w-6">{(i + 1).toString().padStart(2, '0')}</span>

                    {opt.imageUrl ? (
                      <div className="relative w-10 h-10 flex-shrink-0 rounded-md overflow-hidden border border-zinc-200">
                        <img src={opt.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { const newOpts = [...options]; newOpts[i].imageUrl = null; newOpts[i].imageFile = null; setOptions(newOpts); }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md">
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-zinc-100 text-zinc-500 rounded-md cursor-pointer hover:bg-zinc-200 transition-colors border border-zinc-200" title="Añadir imagen a concepto">
                        <ImageIcon size={16} />
                        <input type="file" accept="image/*" onChange={(e) => handleOptionImageChange(i, e)} className="hidden" />
                      </label>
                    )}

                    <input
                      value={opt.text}
                      placeholder={`Concepto ${i + 1}`}
                      onChange={e => {
                        const newOpts = [...options];
                        newOpts[i].text = e.target.value;
                        setOptions(newOpts);
                      }}
                      required
                      className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    />
                    <ArrowRight size={16} className="text-zinc-400 hidden sm:block" />
                  </>
                )}

                <input
                  value={opt.matchCorrect || ''}
                  placeholder={opt.isDistractor ? "Respuesta falsa extra" : `Respuesta correcta para ${i + 1}`}
                  onChange={e => {
                    const newOpts = [...options];
                    newOpts[i].matchCorrect = e.target.value;
                    setOptions(newOpts);
                  }}
                  required
                  className={`flex-1 px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm border ${opt.isDistractor ? 'border-orange-300' : 'border-blue-200'}`}
                />
                <div className="flex items-center gap-2">
                  {(options.length > 2 || opt.isDistractor) && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-md transition-all"
                      title="Borrar opción"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => setOptions([...options, { text: '', isCorrect: true, matchCorrect: '', isDistractor: false, imageUrl: null, imageFile: null }])}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> Añadir otro par
              </button>
              <button
                type="button"
                onClick={() => setOptions([...options, { text: '', isCorrect: true, matchCorrect: '', isDistractor: true, imageUrl: null, imageFile: null }])}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> Añadir Distractor Falso
              </button>
            </div>
          </div>
        )}

        {type === 'TRUE_FALSE' && (
          <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-5">
            <label className="block text-sm font-medium text-zinc-700 mb-3">¿Cuál es la respuesta correcta?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white border border-zinc-200 px-4 py-2.5 rounded-lg hover:border-zinc-300 transition-all">
                <input type="radio" name={`tf_correct_${initialData?.id || 'new'}`} checked={options[0]?.isCorrect} required onChange={() => setOptions([{ text: 'Verdadero', isCorrect: true, imageUrl: null }, { text: 'Falso', isCorrect: false, imageUrl: null }])} className="accent-zinc-900 w-4 h-4" />
                <span className="text-sm font-medium text-zinc-700">Verdadero</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white border border-zinc-200 px-4 py-2.5 rounded-lg hover:border-zinc-300 transition-all">
                <input type="radio" name={`tf_correct_${initialData?.id || 'new'}`} checked={options[1]?.isCorrect} required onChange={() => setOptions([{ text: 'Verdadero', isCorrect: false, imageUrl: null }, { text: 'Falso', isCorrect: true, imageUrl: null }])} className="accent-zinc-900 w-4 h-4" />
                <span className="text-sm font-medium text-zinc-700">Falso</span>
              </label>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center gap-3">
          <button type="submit" className={`px-6 py-2.5 text-white rounded-xl font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${initialData ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600' : 'bg-zinc-900 hover:bg-zinc-800 focus:ring-zinc-900'}`}>
            {initialData ? 'Actualizar Pregunta' : 'Guardar Pregunta'}
          </button>
          {initialData && onCancel && (
            <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl font-medium text-sm hover:bg-zinc-200 transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
