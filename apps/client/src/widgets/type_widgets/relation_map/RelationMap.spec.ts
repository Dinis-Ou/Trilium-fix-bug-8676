import { describe, it, expect, vi, beforeEach } from 'vitest'
import $ from 'jquery'
import { setupImeAwareInput } from './RelationMap'
import utils from '../../../services/utils'

vi.mock('../../../services/utils', async (importOriginal) => {
    const actual = await importOriginal() as any
    return {
        ...actual,
        default: {
            ...actual.default,
            filterAttributeName: vi.fn((val: string) => val.replace(/[^a-z0-9]/gi, ''))
        }
    }
})

describe('IME composition handling - Chinese input', () => {
    let input: HTMLInputElement
    let $answer: JQuery<HTMLInputElement>

    beforeEach(() => {
        vi.clearAllMocks()
        document.body.innerHTML = '<input type="text" />'
        input = document.querySelector('input') as HTMLInputElement
        $answer = $(input) as JQuery<HTMLInputElement>

        setupImeAwareInput($answer)
    })

    it('does not filter intermediate Chinese characters during composition', () => {
        // user starts typing in Chinese IME
        input.dispatchEvent(new Event('compositionstart'))

        // intermediate IME states — these are pinyin keystrokes shown before final char
        input.value = 'n'
        input.dispatchEvent(new Event('input'))
        input.value = 'ni'
        input.dispatchEvent(new Event('input'))
        input.value = 'nin'
        input.dispatchEvent(new Event('input'))
        input.value = 'ning'
        input.dispatchEvent(new Event('input'))

        expect(input.value).toBe('ning')
    })

    it('strips Chinese characters from final value when composition ends', () => {
        input.dispatchEvent(new Event('compositionstart'))

        // intermediate pinyin
        input.value = 'n'
        input.dispatchEvent(new Event('input'))
        input.value = 'ni'
        input.dispatchEvent(new Event('input'))

        // user selects the Chinese character 你 from the IME picker
        input.value = '你'
        input.dispatchEvent(new Event('compositionend'))

        expect(input.value).toBe('')
    })

    it('allows normal latin input after Chinese composition ends', () => {
        // first do a Chinese composition
        input.dispatchEvent(new Event('compositionstart'))
        input.value = '你'
        input.dispatchEvent(new Event('compositionend'))

        // then type normally in latin
        input.value = 'hello'
        input.dispatchEvent(new Event('input'))

        expect(input.value).toBe('hello')
    })

    it('handles multiple Chinese characters in sequence', () => {
        // first character
        input.dispatchEvent(new Event('compositionstart'))
        input.value = '你'
        input.dispatchEvent(new Event('compositionend'))

        // second character
        input.dispatchEvent(new Event('compositionstart'))
        input.value = '好'
        input.dispatchEvent(new Event('compositionend'))

        expect(input.value).toBe('')
    })
});

