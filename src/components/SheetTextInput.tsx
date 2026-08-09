import { Platform, TextInput, type TextInputProps } from 'react-native'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'

export function SheetTextInput(props: TextInputProps) {
  if (Platform.OS === 'web') {
    return <TextInput {...props} />
  }
  return <BottomSheetTextInput {...props} />
}
