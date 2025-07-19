import React from 'react';
import { useForm, useFieldArray, Control, UseFormSetValue } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'nested' | 'objectId' | 'float' | 'boolean';
  nested?: SchemaField[];
}

interface SchemaFormData {
  fields: SchemaField[];
}

interface FieldRowProps {
  fieldPath: string;
  field: SchemaField;
  index: number;
  control: Control<SchemaFormData>;
  setValue: UseFormSetValue<SchemaFormData>;
  watch: any;
  onRemove: (index: number) => void;
  depth?: number;
}

const FieldRow: React.FC<FieldRowProps> = ({ 
  fieldPath,
  field, 
  index, 
  control, 
  setValue,
  watch,
  onRemove, 
  depth = 0 
}) => {
  const { fields: nestedFields, append: appendNested, remove: removeNested } = useFieldArray({
    control,
    name: `${fieldPath}.nested` as const,
  });

  const addNestedField = () => {
    appendNested({
      id: `nested-${Date.now()}`,
      name: `field${nestedFields.length + 1}`,
      type: 'string'
    });
  };

  const removeNestedField = (nestedIndex: number) => {
    removeNested(nestedIndex);
  };

  const currentType = watch(`${fieldPath}.type`);

  return (
    <div className="space-y-4">
      <Card className={cn(
        "transition-all duration-200",
        depth > 0 && "ml-6 border-l-4 border-l-blue-200"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`field-name-${fieldPath}`}>Field Name</Label>
                <Input
                  id={`field-name-${fieldPath}`}
                  {...control.register(`${fieldPath}.name`)}
                  placeholder="Enter field name"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`field-type-${fieldPath}`}>Type</Label>
                <Select
                  value={watch(`${fieldPath}.type`) || field.type}
                  onValueChange={(value) => {
                    setValue(`${fieldPath}.type` as any, value);
                    
                    if (value === 'nested' && (!nestedFields || nestedFields.length === 0)) {
                      appendNested({
                        id: `nested-${Date.now()}`,
                        name: 'field1',
                        type: 'string'
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="float">Float</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="objectId">ObjectId</SelectItem>
                    <SelectItem value="nested">Nested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {currentType === 'nested' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNestedField}
                className="flex items-center gap-1"
              >
                <Plus size={16} />
                Add Nested
              </Button>
            )}
            
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRemove(index)}
              className="flex items-center gap-1"
            >
              <Trash2 size={16} />
            </Button>
          </div>
          
          {currentType === 'nested' && nestedFields && nestedFields.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-medium text-muted-foreground">
                Nested Fields ({nestedFields.length})
              </Label>
              {nestedFields.map((nestedField, nestedIndex) => (
                <FieldRow
                  key={nestedField.id}
                  fieldPath={`${fieldPath}.nested.${nestedIndex}`}
                  field={nestedField}
                  index={nestedIndex}
                  control={control}
                  setValue={setValue}
                  watch={watch}
                  onRemove={removeNestedField}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const SchemaBuilder: React.FC = () => {
  const { control, watch, setValue } = useForm<SchemaFormData>({
    defaultValues: {
      fields: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields'
  });

  const watchedFields = watch('fields');

  const addField = () => {
    append({
      id: `field-${Date.now()}`,
      name: `field${fields.length + 1}`,
      type: 'string'
    });
  };

  const removeField = (index: number) => {
    remove(index);
  };

  const generateJsonSchema = () => {
    const convertFieldsToJson = (fields: SchemaField[]): any => {
      const result: any = {};
      
      if (!fields || fields.length === 0) return result;
      
      fields.forEach(field => {
        const fieldName = field.name || 'unnamed_field';
        
        switch (field.type) {
          case 'nested':
            result[fieldName] = field.nested && field.nested.length > 0 
              ? convertFieldsToJson(field.nested) 
              : {};
            break;
          case 'string':
            result[fieldName] = 'string';
            break;
          case 'number':
            result[fieldName] = 'number';
            break;
          case 'float':
            result[fieldName] = 'float';
            break;
          case 'boolean':
            result[fieldName] = 'boolean';
            break;
          case 'objectId':
            result[fieldName] = 'objectId';
            break;
          default:
            result[fieldName] = 'unknown';
        }
      });
      
      return result;
    };

    return watchedFields && watchedFields.length > 0 ? convertFieldsToJson(watchedFields) : {};
  };

  const jsonSchema = generateJsonSchema();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">JSON Schema Builder</h1>
        <p className="text-muted-foreground mt-2">
          Build dynamic JSON schemas with nested fields and real-time preview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schema Builder Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Schema Builder</h2>
            <Button onClick={addField} className="flex items-center gap-2">
              <Plus size={16} />
              Add Field
            </Button>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {fields.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No fields defined yet</p>
                  <Button onClick={addField} variant="outline">
                    Add Your First Field
                  </Button>
                </CardContent>
              </Card>
            ) : (
              fields.map((field, index) => (
                <FieldRow
                  key={field.id}
                  fieldPath={`fields.${index}`}
                  field={field}
                  index={index}
                  control={control}
                  setValue={setValue}
                  watch={watch}
                  onRemove={removeField}
                />
              ))
            )}
          </div>
        </div>

        {/* JSON Preview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">JSON Preview</h2>
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(JSON.stringify(jsonSchema, null, 2))}
            >
              Copy JSON
            </Button>
          </div>
          
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg">Generated JSON Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm h-[300px] text-left">
                <code>{JSON.stringify(jsonSchema, null, 2)}</code>
              </pre>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schema Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {watchedFields?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Fields</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {watchedFields?.filter(f => f.type === 'nested').length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Nested Fields</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-purple-600">
                    {JSON.stringify(jsonSchema).length}
                  </div>
                  <div className="text-sm text-muted-foreground">JSON Size (bytes)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};