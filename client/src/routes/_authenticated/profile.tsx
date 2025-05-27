import PageHeaderText from '@/components/page-header-text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarInset } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getCurrentOJT,
  updateStudentPersonalInfo,
  updateStudentSupervisorInfo,
  updateProfilePicture,
  updateUserPassword,
  getClasses,
  updateAdminOrCoordinatorPersonalInfo,
} from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Pencil, Save, X, KeyRound } from 'lucide-react';
import { User2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CategoryBadge from '@/components/category-badge';
import { toast } from 'sonner';
import { ACADEMIC_YEARS } from '@/lib/constants';
export const Route = createFileRoute('/_authenticated/profile')({
  component: RouteComponent,
});

const personalInfoSchema = z.object({
  fullName: z.string().min(1),
  gender: z.enum(['male', 'female']),
  classId: z.coerce.number().optional(),
  yearLevel: z.string().min(1),
  semester: z.string().min(1),
  totalOJTHours: z.number().min(1),
  email: z.string().email().optional(),
  academicYear: z.string().min(1),
});

const adminOrCoorinatorPersonalInfoSchema = z.object({
  fullName: z.string().min(1),
  gender: z.enum(['male', 'female']),
  email: z.string().email().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const supervisorInfoSchema = z.object({
  supervisorName: z.string().min(1),
  supervisorEmail: z.string().email(),
  supervisorContactNumber: z.string().optional(),
  supervisorAddress: z.string().optional(),
});

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
type AdminOrCoordinatorPersonalInfoForm = z.infer<
  typeof adminOrCoorinatorPersonalInfoSchema
>;
type PasswordForm = z.infer<typeof passwordSchema>;
type SupervisorInfoForm = z.infer<typeof supervisorInfoSchema>;

function RouteComponent() {
  const { user: initialUser } = Route.useRouteContext();

  // Get the latest user data from query cache
  const queryClient = useQueryClient();
  const latestUserData =
    queryClient.getQueryData<typeof initialUser>(['get-current-user']) ||
    initialUser;

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingSupervisor, setIsEditingSupervisor] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(
    latestUserData.profilePictureUrl ?? undefined,
  );

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const newUserData = queryClient.getQueryData<typeof initialUser>([
        'get-current-user',
      ]);
      if (newUserData && newUserData.profilePictureUrl !== profilePicture) {
        setProfilePicture(newUserData.profilePictureUrl ?? undefined);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, profilePicture]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { isPending: studentOJTPending, data: studentOJT } = useQuery({
    queryKey: ['student-ojt'],
    queryFn: getCurrentOJT,
    enabled: latestUserData.role === 'student',
  });

  const { isPending: classPending, data: classData } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
    enabled: latestUserData.role === 'student',
  });

  const personalInfoForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: latestUserData.fullName,
      gender: latestUserData.gender,
      yearLevel: studentOJT?.yearLevel ?? '',
      semester: studentOJT?.semester ?? '',
      totalOJTHours: studentOJT?.totalOJTHours ?? 0,
      classId: studentOJT?.class?.id ?? 0,
      academicYear: studentOJT?.academicYear ?? '',
      email: latestUserData.email,
    },
  });

  const adminPersonalInfoForm = useForm<AdminOrCoordinatorPersonalInfoForm>({
    resolver: zodResolver(adminOrCoorinatorPersonalInfoSchema),
    defaultValues: {
      fullName: latestUserData.fullName,
      gender: latestUserData.gender,
      email: latestUserData.email,
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const supervisorInfoForm = useForm<SupervisorInfoForm>({
    resolver: zodResolver(supervisorInfoSchema),
    defaultValues: {
      supervisorName: studentOJT?.supervisorName ?? '',
      supervisorEmail: studentOJT?.supervisorEmail ?? '',
      supervisorContactNumber: studentOJT?.supervisorContactNumber ?? '',
      supervisorAddress: studentOJT?.supervisorAddress ?? '',
    },
  });

  const personalInfoMutation = useMutation({
    mutationFn: updateStudentPersonalInfo,
  });

  const updateProfilePictureMutation = useMutation({
    mutationFn: updateProfilePicture,
  });

  const updateSupervisorInfoMutation = useMutation({
    mutationFn: updateStudentSupervisorInfo,
  });

  const changePasswordMutation = useMutation({
    mutationFn: updateUserPassword,
  });

  const updateAdminOrCoordinatorPersonalInfoMutation = useMutation({
    mutationFn: updateAdminOrCoordinatorPersonalInfo,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    updateProfilePictureMutation.mutate(
      { file: selectedFile },
      {
        onSuccess: (data) => {
          if (data && data.profilePictureUrl) {
            setProfilePicture(data.profilePictureUrl);
          }

          queryClient.setQueryData<typeof initialUser>(
            ['get-current-user'],
            (oldData) => {
              if (oldData) {
                return {
                  ...oldData,
                  profilePictureUrl:
                    data?.profilePictureUrl || oldData.profilePictureUrl,
                };
              }
              return initialUser;
            },
          );

          queryClient.invalidateQueries({ queryKey: ['get-current-user'] });
          toast.success('Profile picture updated successfully');
        },
        onError: (error) => {
          console.log(error);
          toast.error('Failed to update profile picture');
        },
        onSettled: () => {
          e.target.value = '';
        },
      },
    );
  };

  const onSubmitPersonalInfo = (data: PersonalInfoForm) => {
    const { email, classId, ...rest } = data;
    personalInfoMutation.mutate(rest, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['student-ojt'] });
        queryClient.invalidateQueries({ queryKey: ['get-current-user'] });

        setIsEditing(false);
        toast.success('Personal info updated successfully');
      },
      onError: () => {
        toast.error('Failed to update personal info');
      },
    });
  };

  const onSubmitAdminPersonalInfo = (
    data: AdminOrCoordinatorPersonalInfoForm,
  ) => {
    const { email, ...rest } = data;
    updateAdminOrCoordinatorPersonalInfoMutation.mutate(rest, {
      onSuccess: (updatedData) => {
        queryClient.setQueryData<typeof initialUser>(
          ['get-current-user'],
          (oldData) => {
            if (oldData) {
              return {
                ...oldData,
                ...rest,
              };
            }
            return initialUser;
          },
        );

        queryClient.invalidateQueries({ queryKey: ['get-current-user'] });

        setIsEditing(false);
        toast.success('Personal info updated successfully');
      },
      onError: () => {
        toast.error('Failed to update personal info');
      },
    });
  };

  const onSubmitPassword = (data: PasswordForm) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        setIsChangingPassword(false);
        passwordForm.reset();
        toast.success('Password updated successfully');
      },
      onError: () => {
        toast.error('Failed to update password');
      },
    });
  };

  const onSubmitSupervisorInfo = (data: SupervisorInfoForm) => {
    updateSupervisorInfoMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['student-ojt'] });
        queryClient.invalidateQueries({ queryKey: ['get-current-user'] });
        setIsEditingSupervisor(false);
        toast.success('Supervisor info updated successfully');
      },
      onError: () => {
        toast.error('Failed to update supervisor info');
      },
    });
  };

  const handleCancelEdit = () => {
    personalInfoForm.reset();
    setIsEditing(false);
  };

  const handleCancelEditSupervisor = () => {
    supervisorInfoForm.reset();
    setIsEditingSupervisor(false);
  };

  const isLoading = useMemo(
    () => studentOJTPending || classPending,
    [studentOJTPending, classPending],
  );

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Profile</PageHeaderText>
      <div className='w-full border-b pb-2 flex gap-2 items-center'>
        <Avatar className='w-20 h-20'>
          <AvatarImage src={profilePicture || undefined} />
          <AvatarFallback>
            <User2 className='w-12 h-12' />
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-col justify-start gap-1'>
          <div className='flex gap-2 items-center'>
            <p className='font-semibold'>{latestUserData.fullName}</p>
            {latestUserData.role === 'student' && (
              <CategoryBadge category={studentOJT?.ojtStatus!} />
            )}
          </div>
          <p className='text-sm text-gray-500'>
            {latestUserData.srCode} | {latestUserData.email}
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant='link'
            className='p-0 underline self-start h-full'>
            Update Profile Picture
            <Input
              type='file'
              ref={fileInputRef}
              accept='image/*'
              className='hidden'
              onChange={(e) => handleFileChange(e)}
            />
          </Button>
        </div>
      </div>
      <section>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>Personal Information</h3>
          {isEditing ? (
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={handleCancelEdit}>
                <X className='h-4 w-4 mr-1' /> Cancel
              </Button>
              <Button
                variant='default'
                size='sm'
                onClick={
                  latestUserData.role === 'student'
                    ? personalInfoForm.handleSubmit(onSubmitPersonalInfo)
                    : adminPersonalInfoForm.handleSubmit(
                        onSubmitAdminPersonalInfo,
                      )
                }>
                <Save className='h-4 w-4 mr-1' /> Save
              </Button>
            </div>
          ) : (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditing(true)}>
              <Pencil className='h-4 w-4 mr-1' /> Edit
            </Button>
          )}
        </div>

        {isLoading && latestUserData.role === 'student' ? (
          <div className='grid grid-cols-2 gap-2'>
            {new Array(6).fill(null).map((_, index) => (
              <Skeleton key={index} className='h-10 w-full' />
            ))}
          </div>
        ) : isEditing ? (
          latestUserData.role === 'student' ? (
            <Form {...personalInfoForm}>
              <form
                onSubmit={personalInfoForm.handleSubmit(onSubmitPersonalInfo)}
                className='flex flex-col gap-4'>
                <div className='grid grid-cols-2 gap-2'>
                  <FormField
                    control={personalInfoForm.control}
                    name='fullName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalInfoForm.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input disabled {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalInfoForm.control}
                    name='gender'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a gender' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='male'>Male</SelectItem>
                            <SelectItem value='female'>Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {latestUserData.role === 'student' && (
                    <>
                      <FormField
                        control={personalInfoForm.control}
                        name='classId'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger disabled>
                                  <SelectValue placeholder='Select a class' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {!isLoading &&
                                  classData &&
                                  classData.map((classItem) => (
                                    <SelectItem
                                      key={classItem.id}
                                      value={classItem.id.toString()}>
                                      {classItem.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name='yearLevel'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select a year level' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='1st year'>
                                  1st year
                                </SelectItem>
                                <SelectItem value='2nd year'>
                                  2nd year
                                </SelectItem>
                                <SelectItem value='3rd year'>
                                  3rd year
                                </SelectItem>
                                <SelectItem value='4th year'>
                                  4th year
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name='semester'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semester</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select a semester' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='1st semester'>
                                  1st semester
                                </SelectItem>
                                <SelectItem value='2nd semester'>
                                  2nd semester
                                </SelectItem>
                                <SelectItem value='3rd semester'>
                                  3rd semester
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name='academicYear'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Academic Year</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select an academic year' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ACADEMIC_YEARS.map((year) => (
                                  <SelectItem key={year} value={year}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name='totalOJTHours'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total OJT Hours</FormLabel>
                            <FormControl>
                              <Input type='number' {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </form>
            </Form>
          ) : (
            <Form {...adminPersonalInfoForm}>
              <form
                onSubmit={adminPersonalInfoForm.handleSubmit(
                  onSubmitAdminPersonalInfo,
                )}
                className='flex flex-col gap-4'>
                <div className='grid grid-cols-2 gap-2'>
                  <FormField
                    control={adminPersonalInfoForm.control}
                    name='fullName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adminPersonalInfoForm.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input disabled {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adminPersonalInfoForm.control}
                    name='gender'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select a gender' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='male'>Male</SelectItem>
                            <SelectItem value='female'>Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )
        ) : (
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium text-gray-500'>Name</p>
              <p>{latestUserData.fullName}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Email</p>
              <p>{latestUserData.email}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Gender</p>
              <p className='capitalize'>{latestUserData.gender}</p>
            </div>
            {latestUserData.role === 'student' && (
              <>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Class</p>
                  <p>{studentOJT?.class?.name}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Year Level
                  </p>
                  <p>{studentOJT?.yearLevel || ''}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Semester</p>
                  <p>{studentOJT?.semester || ''}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Academic Year
                  </p>
                  <p>{studentOJT?.academicYear || ''}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Total OJT Hours
                  </p>
                  <p>{studentOJT?.totalOJTHours || 0}</p>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <section className='mt-8'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>Password</h3>
          {isChangingPassword ? (
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setIsChangingPassword(false);
                  passwordForm.reset();
                }}>
                <X className='h-4 w-4 mr-1' /> Cancel
              </Button>
              <Button
                variant='default'
                size='sm'
                onClick={passwordForm.handleSubmit(onSubmitPassword)}>
                <Save className='h-4 w-4 mr-1' /> Save
              </Button>
            </div>
          ) : (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsChangingPassword(true)}>
              <KeyRound className='h-4 w-4 mr-1' /> Change Password
            </Button>
          )}
        </div>

        {isChangingPassword ? (
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
              className='flex flex-col gap-4'>
              <div className='grid grid-cols-1 gap-4 max-w-md'>
                <FormField
                  control={passwordForm.control}
                  name='currentPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type='password' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name='newPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type='password' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type='password' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        ) : (
          <p className='text-sm text-gray-500'>
            Change your password to keep your account secure.
          </p>
        )}
      </section>

      {latestUserData.role === 'student' && (
        <>
          <section className='mt-8'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>Company Information</h3>
            </div>
            {isLoading ? (
              <div className='grid grid-cols-2 gap-2'>
                {new Array(2).fill(null).map((_, index) => (
                  <Skeleton key={index} className='h-10 w-full' />
                ))}
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Name</p>
                  <p>{studentOJT?.company?.name}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Address</p>
                  <p>{studentOJT?.company?.address}</p>
                </div>
              </div>
            )}
          </section>

          <section className='mt-8'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>Supervisor Information</h3>
              {isEditingSupervisor ? (
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleCancelEditSupervisor}>
                    <X className='h-4 w-4 mr-1' /> Cancel
                  </Button>
                  <Button
                    variant='default'
                    size='sm'
                    onClick={supervisorInfoForm.handleSubmit(
                      onSubmitSupervisorInfo,
                    )}>
                    <Save className='h-4 w-4 mr-1' /> Save
                  </Button>
                </div>
              ) : (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsEditingSupervisor(true)}>
                  <Pencil className='h-4 w-4 mr-1' /> Edit
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className='grid grid-cols-2 gap-2'>
                {new Array(6).fill(null).map((_, index) => (
                  <Skeleton key={index} className='h-10 w-full' />
                ))}
              </div>
            ) : isEditingSupervisor ? (
              <Form {...supervisorInfoForm}>
                <form
                  onSubmit={supervisorInfoForm.handleSubmit(
                    onSubmitSupervisorInfo,
                  )}
                  className='flex flex-col gap-4'>
                  <div className='grid grid-cols-2 gap-2'>
                    <FormField
                      control={supervisorInfoForm.control}
                      name='supervisorName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supervisorInfoForm.control}
                      name='supervisorEmail'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supervisorInfoForm.control}
                      name='supervisorContactNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supervisorInfoForm.control}
                      name='supervisorAddress'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            ) : (
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Name</p>
                  <p>{supervisorInfoForm.getValues().supervisorName}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Email</p>
                  <p>{supervisorInfoForm.getValues().supervisorEmail}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Contact Number
                  </p>
                  <p>
                    {supervisorInfoForm.getValues().supervisorContactNumber}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Address</p>
                  <p>{supervisorInfoForm.getValues().supervisorAddress}</p>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </SidebarInset>
  );
}
