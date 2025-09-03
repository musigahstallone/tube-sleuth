'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import type { AdvancedSearchRequest } from '@/lib/types';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  query: z.string().min(1, 'Query is required.'),
  publishedAfter: z.date().optional(),
  publishedBefore: z.date().optional(),
  order: z.string().optional(),
  videoDuration: z.string().optional(),
  maxResults: z.coerce.number().int().min(1).max(50).optional(),
});

type AdvancedSearchProps = {
    onSearch: (data: AdvancedSearchRequest) => void;
    defaultValues: AdvancedSearchRequest;
}

export default function AdvancedSearch({ onSearch, defaultValues }: AdvancedSearchProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        query: defaultValues.query || '',
        order: defaultValues.order || 'relevance',
        videoDuration: defaultValues.videoDuration || 'any',
        maxResults: defaultValues.maxResults || 25,
        publishedAfter: defaultValues.publishedAfter ? new Date(defaultValues.publishedAfter) : undefined,
        publishedBefore: defaultValues.publishedBefore ? new Date(defaultValues.publishedBefore) : undefined,
    },
  });

  useEffect(() => {
    form.reset({
        query: defaultValues.query || '',
        order: defaultValues.order || 'relevance',
        videoDuration: defaultValues.videoDuration || 'any',
        maxResults: defaultValues.maxResults || 25,
        publishedAfter: defaultValues.publishedAfter ? new Date(defaultValues.publishedAfter) : undefined,
        publishedBefore: defaultValues.publishedBefore ? new Date(defaultValues.publishedBefore) : undefined,
    })
  }, [defaultValues, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const searchParams: AdvancedSearchRequest = {
      ...values,
      query: values.query || defaultValues.query,
      publishedAfter: values.publishedAfter ? values.publishedAfter.toISOString() : undefined,
      publishedBefore: values.publishedBefore ? values.publishedBefore.toISOString() : undefined,
    };
    onSearch(searchParams);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only">Advanced Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Advanced Video Search</DialogTitle>
          <DialogDescription>
            Refine your search with more specific criteria.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Query</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Next.js 14 tutorials" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="publishedAfter"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Published After</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={'outline'}
                            className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                            )}
                            >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="publishedBefore"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Published Before</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={'outline'}
                            className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                            )}
                            >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort By</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sorting order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date">Upload Date</SelectItem>
                      <SelectItem value="viewCount">View Count</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="maxResults"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Results</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="videoDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select video duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="short">Short (&lt; 4 minutes)</SelectItem>
                      <SelectItem value="medium">Medium (4-20 minutes)</SelectItem>
                      <SelectItem value="long">Long (&gt; 20 minutes)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Search</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
