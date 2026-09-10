import { Button, Form, InputNumber } from 'antd';

import { ItemFormDto, type ItemFormInterface } from '@shared/dto/item/item-form.dto';

import { getApiErrorMessage } from '@web/shared/lib/get-api-error-message';
import { dtoFormItemProps } from '@web/shared/lib/yup-dto-field-rules';

interface AddItemFormPropsInterface {
  loading: boolean;
  onAdd: (id: number) => Promise<void>;
}

const idField = 'id' satisfies keyof ItemFormInterface;

export const AddItemForm = ({ loading, onAdd }: AddItemFormPropsInterface) => {
  const [form] = Form.useForm<ItemFormInterface>();

  return (
    <Form
      form={form}
      layout="inline"
      className="add-form"
      onFinish={async values => {
        try {
          await onAdd(values.id);
          form.resetFields();
        } catch (error) {
          form.setFields([
            {
              name: idField,
              errors: [getApiErrorMessage(error, 'Не удалось добавить')],
            },
          ]);
        }
      }}
    >
      <Form.Item name={idField} {...dtoFormItemProps(ItemFormDto, idField)}>
        <InputNumber placeholder="Новый ID" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Добавить
        </Button>
      </Form.Item>
    </Form>
  );
};
