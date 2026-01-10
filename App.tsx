// Trecho do handleCreateAccount dentro do Dashboard (3).tsx
const handleCreateAccount = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!userProfile) return;

  setLoading(true);
  try {
    const { data, error } = await supabase.functions.invoke(
      'create_reseller',
      {
        body: {
          email: formData.email,
          password: formData.password,
          parent_id: userProfile.id
        }
      }
    );

    // O invoke pode não lançar erro mas a função retornar { error: "..." }
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.success) throw new Error('Falha ao criar revendedor');

    setCreateModal(false);
    setFormData({ email: '', password: '' });
    await loadData();
    alert('Revenda criada com sucesso!');
  } catch (err: any) {
    alert('Erro: ' + err.message);
  } finally {
    setLoading(false);
  }
};
