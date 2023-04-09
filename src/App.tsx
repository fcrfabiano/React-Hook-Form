import { useState } from 'react';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import { PlusCircle, XCircle } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from './components/Form';
import { supabse } from './lib/supabase';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5mb
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const createUserFormSchema = z.object({
  avatar: z.instanceof(FileList)
    .refine((files) => !!files.item(0), 'A imagem de perfil é obrigatória')
    .refine((files) => files.item(0)!.size <= MAX_FILE_SIZE, 'Tamanho máximo de 5MB')
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files.item(0)!.type), "Formato de imagem inválido")
    .transform((list) => list.item(0)!),
  name: z
    .string()
    .nonempty({ message: 'O nome é obrigatório' })
    .transform((name) =>
      name
        .trim()
        .split(' ')
        .map((word) => word[0].toLocaleUpperCase().concat(word.substring(1)))
        .join(' ')
    ),
  email: z
    .string()
    .nonempty({ message: 'O e-mail é obrigatório' })
    .email({ message: 'Formato de e-mail inválido' })
    .toLowerCase(),
    // .refine(
    //   (email) => email.endsWith('gmail.com'),
    //   'O e-mail precisa ser gmail'
    // ),
  password: z.string()
    .nonempty({ message: 'A senha é obrigatória' })
    .min(6, { message: 'A senha precisa ter no mínimo 6 caracteres' }),
  techs: z.array(
    z.object({
      title: z.string()
        .nonempty({ message: 'O nome da tecnologia é obrigatório' }),
      // knowledge: z.coerce.number().min(1).max(100),
    })
  )
    .min(2, 'Insira pelo menos 2 tecnologias')
    // .refine((techs) => techs.some((tech) => tech.knowledge > 50), 'Você está aprendendo!'),
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;

function App() {
  const [output, setOutput] = useState('');
  
  const createUserForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    watch,
  } = createUserForm;

  async function createUser(data: CreateUserFormData) {
    const { data: uploadData, error } = await supabse
      .storage
      .from('test')
      .upload(`avatars/${data.avatar?.name}`, data.avatar, {
        cacheControl: '3600',
        upsert: false,
      });

    setOutput(JSON.stringify(data, null, 2));
  }

  const userPassword = watch('password');
  const isPasswordStrong = new RegExp(
    '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})'
  ).test(userPassword);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'techs',
  });

  function addNewTech() {
    append({ title: '', knowledge: 0 });
  }

  // console.log(formState.errors);


  return (
    <main className="h-screen bg-zinc-950 text-zinc-300 flex flex-col gap-10 items-center justify-center">
      <FormProvider {...createUserForm}>
        <form onSubmit={handleSubmit(createUser)}>
          <Form.Field>
            <Form.Label htmlFor="avatar">Avatar</Form.Label>

            <Form.Input type="file" name="avatar" />
            <Form.ErrorMessage field="avatar" />
          </Form.Field>

          <Form.Field>
            <Form.Label htmlFor="name">Nome</Form.Label>
            <Form.Input type="name" name="name" />
            <Form.ErrorMessage field="name" />
          </Form.Field>

          <Form.Field>
            <Form.Label htmlFor="email">E-mail</Form.Label>
            <Form.Input type="email" name="email" />
            <Form.ErrorMessage field="email" />
          </Form.Field>

          <Form.Field>
            <Form.Label htmlFor="password">
              Senha
              {isPasswordStrong ? (
                <span className="text-xs text-emerald-600">Senha forte</span>
              ) : (
                <span className="text-xs text-red-500">Senha fraca</span>
              )}
            </Form.Label>
            <Form.Input type="password" name="password" />
            <Form.ErrorMessage field="password" />
          </Form.Field>

          <Form.Field>
            <Form.Label>
              Tecnologias
              <button
                type="button"
                onClick={addNewTech}
                className="text-emerald-500 font-semibold text-xs flex items-center gap-1"
              >
                Adicionar nova
                <PlusCircle size={14} />
              </button>
            </Form.Label>
            <Form.ErrorMessage field="techs" />

            {fields.map((field, index) => {
              const fieldName = `techs.${index}.title`;

              return (
                <Form.Field key={field.id}>
                  <div className="flex gap-2 items-center">
                    <Form.Input type={fieldName} name={fieldName} />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                  <Form.ErrorMessage field={fieldName} />
                </Form.Field>
              );
            })}
          </Form.Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-violet-500 text-white rounded px-3 h-10 font-semibold text-sm hover:bg-violet-600"
          >
            Salvar
          </button>
        </form>

        {output && (
          <pre className="text-sm bg-zinc-800 text-zinc-100 p-6 rounded-lg">
            {output}
          </pre>
        )}
      </FormProvider>
      {/* <form
        onSubmit={handleSubmit(createUser)}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="">Avatar</label>
          <input type="file" accept="image/*" {...register('avatar')} />
          {errors.avatar && (
            <span className="text-red-500 text-sm">
              {errors.avatar.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="">Nome</label>
          <input
            type="name"
            className="border border-zinc-600 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white"
            {...register('name')}
          />
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="">E-mail</label>
          <input
            type="email"
            className="border border-zinc-600 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white"
            {...register('email')}
          />
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="">Senha</label>
          <input
            type="password"
            className="border border-zinc-600 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white"
            {...register('password')}
          />
          {errors.password && (
            <span className="text-red-500 text-sm">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="" className="flex items-center justify-between">
            Tecnologias
            <button
              type="button"
              onClick={addNewTech}
              className="text-emerald-500 text-xs"
            >
              Adicionar
            </button>
          </label>

          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <input
                  type="text"
                  className="border border-zinc-600 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white"
                  {...register(`techs.${index}.title`)}
                />

                {errors.techs?.[index]?.title && (
                  <span className="text-red-500 text-sm">
                    {errors.techs?.[index]?.title?.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <input
                  type="number"
                  className="w-16 border border-zinc-600 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white"
                  {...register(`techs.${index}.knowledge`)}
                />

                {errors.techs?.[index]?.knowledge && (
                  <span className="text-red-500 text-sm">
                    {errors.techs?.[index]?.knowledge?.message}
                  </span>
                )}
              </div>
            </div>
          ))}

          {errors.techs && (
            <span className="text-red-500 text-sm">
              {errors.techs?.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="bg-emerald-500 rounded font-semibold text-white h-10 hover:bg-emerald-600"
        >
          Salvar
        </button>
      </form>
      <pre>{output}</pre> */}
    </main>
  );
}

export default App;
