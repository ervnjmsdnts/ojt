import CategoryBadge from '@/components/category-badge';
import { EditableTableCell } from '@/components/editable-table-cell';
import PageHeaderText from '@/components/page-header-text';
import Pagination from '@/components/pagination';
import TableRowSkeleton from '@/components/table-row-skeleton';
import AddTemplateDialog from '@/components/templates/add-template-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarInset } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import usePagination from '@/hooks/use-pagination';
import {
  getTemplates,
  updateTemplateCategory,
  UpdateTemplateCategory,
  updateTemplateFile,
  updateTemplateTitle,
} from '@/lib/api';
import { OJTCategory } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Archive, File, Loader2 } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/templates')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    isPending,
    data: templates,
    error,
  } = useQuery({ queryKey: ['templates'], queryFn: getTemplates });

  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [filterTitle, setFilterTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState<OJTCategory | 'any'>(
    'any',
  );
  const [editingRowCategory, setEditingRowCategory] = useState<number | null>(
    null,
  );
  const [editingRowTitle, setEditingRowTitle] = useState<number | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');

  const updateFileMutation = useMutation({
    mutationFn: updateTemplateFile,
  });
  const updateCategoryMutation = useMutation({
    mutationFn: updateTemplateCategory,
  });
  const updateTitleMutation = useMutation({ mutationFn: updateTemplateTitle });

  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    templateId: number,
  ) {
    e.preventDefault();
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    updateFileMutation.mutate(
      { templateId, file: selectedFile },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['templates'] });
          toast.success('Template file updated successfully');
        },
        onError: (error) => {
          console.log(error);
          toast.error('Failed to update template file');
        },
        onSettled: () => {
          setEditingRowTitle(null);
          e.target.value = '';
        },
      },
    );
  }

  const onUpdateCategory = (data: UpdateTemplateCategory) => {
    updateCategoryMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['templates'] });
        setEditingRowCategory(null);
        toast.success('Template category updated successfully');
      },
    });
  };

  const onUpdateTitle = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      data: { templateId: number },
    ) => {
      if (e.key === 'Enter') {
        if (!updateTitle) {
          return toast.error('Title cannot be empty');
        }
        updateTitleMutation.mutate(
          { templateId: data.templateId, title: updateTitle },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['templates'] });
              setEditingRowTitle(null);
              toast.success('Template title updated successfully');
            },
          },
        );
      }
    },
    [updateTitle],
  );

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    return templates.filter((template) => {
      const titleMatches = template.title
        .toLowerCase()
        .includes(filterTitle.toLowerCase());

      const categoryMatches =
        filterCategory === 'any' ? true : template.category === filterCategory;

      return titleMatches && categoryMatches;
    });
  }, [templates, filterTitle, filterCategory]);

  const { currentItems, paginate, currentPage, totalPages } =
    usePagination(filteredTemplates);

  if (error) return <p>Error</p>;
  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Templates</PageHeaderText>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Input
            onChange={(e) => setFilterTitle(e.target.value)}
            className='max-w-xs'
            placeholder='Search by title...'
          />
          <Select
            defaultValue='any'
            onValueChange={(value) =>
              setFilterCategory(value as OJTCategory | 'any')
            }>
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder='Select category...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Any</SelectItem>
              <SelectItem value='pre-ojt'>Pre-OJT</SelectItem>
              <SelectItem value='ojt'>OJT</SelectItem>
              <SelectItem value='post-ojt'>Post-OJT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AddTemplateDialog />
      </div>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className='text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRowSkeleton columnCount={4} />
              ) : (
                currentItems.map((template, index) => (
                  <TableRow key={template.id}>
                    <EditableTableCell
                      editing={editingRowTitle === index}
                      onToggleEditing={() =>
                        setEditingRowTitle(
                          editingRowTitle === index ? null : index,
                        )
                      }>
                      {editingRowTitle === index ? (
                        <div className='flex items-center w-[250px] gap-1'>
                          <Tooltip>
                            <TooltipTrigger>
                              <Input
                                defaultValue={template.title}
                                onChange={(e) => setUpdateTitle(e.target.value)}
                                onKeyDown={(e) =>
                                  onUpdateTitle(e, { templateId: template.id })
                                }
                                className='w-[200px]'
                              />
                            </TooltipTrigger>
                            <TooltipContent>Change Title</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                disabled={updateFileMutation.isPending}
                                onClick={handleFileSelect}
                                size='icon'>
                                {updateFileMutation.isPending ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <File />
                                )}
                                <Input
                                  type='file'
                                  ref={fileInputRef}
                                  className='hidden'
                                  onChange={(e) =>
                                    handleFileChange(e, template.id)
                                  }
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Change File</TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <Button variant='link' className='p-0' asChild>
                          <Link to={template.fileUrl}>{template.title}</Link>
                        </Button>
                      )}
                    </EditableTableCell>
                    <EditableTableCell
                      editing={editingRowCategory === index}
                      onToggleEditing={() =>
                        setEditingRowCategory(
                          editingRowCategory === index ? null : index,
                        )
                      }>
                      {editingRowCategory === index ? (
                        <Select
                          defaultValue={template.category}
                          onValueChange={(value) =>
                            onUpdateCategory({
                              category: value as OJTCategory,
                              templateId: template.id,
                            })
                          }>
                          <SelectTrigger className='w-[120px]'>
                            <SelectValue placeholder='Select role...' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='pre-ojt'>Pre-OJT</SelectItem>
                            <SelectItem value='ojt'>OJT</SelectItem>
                            <SelectItem value='post-ojt'>Post-OJT</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <CategoryBadge category={template.category} />
                      )}
                    </EditableTableCell>
                    <TableCell>{template.uploadedBy?.fullName}</TableCell>
                    <TableCell>{format(template.updatedAt!, 'PPp')}</TableCell>
                    <TableCell>
                      <div className='flex justify-center'>
                        <Button variant='destructive' size='icon'>
                          <Archive />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className='self-end'>
          <Pagination
            totalPages={totalPages}
            paginate={paginate}
            currentPage={currentPage}
          />
        </div>
      </div>
    </SidebarInset>
  );
}
