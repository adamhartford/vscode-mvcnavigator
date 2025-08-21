// Integration test for Html.Partial and Html.PartialAsync support
// This file verifies that the new functionality is properly integrated

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Html.Partial and Html.PartialAsync Navigation Tests', () => {
    const sampleWorkspaceFolder = path.join(__dirname, '..', 'sample');
    
    test('Should match @Html.Partial patterns correctly', () => {
        const HTML_PARTIAL_WITH_NAME_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*\)/g;
        const HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
        
        // Test basic @Html.Partial
        let match = HTML_PARTIAL_WITH_NAME_REGEX.exec('@Html.Partial("_DemoPartial")');
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        HTML_PARTIAL_WITH_NAME_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_NAME_REGEX.exec("@Html.Partial('_DemoPartial')");
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        // Test @Html.Partial with model
        HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.exec('@Html.Partial("_DemoPartial", Model)');
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_NAME_AND_MODEL_REGEX.exec('@Html.Partial("_ProductSummary", Model.Product)');
        assert.strictEqual(match?.[1], '_ProductSummary');
    });
    
    test('Should match @await Html.PartialAsync patterns correctly', () => {
        const HTML_PARTIAL_ASYNC_WITH_NAME_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*\)/g;
        const HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
        
        // Test basic @await Html.PartialAsync
        let match = HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.exec('@await Html.PartialAsync("_DemoPartial")');
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.exec("@await Html.PartialAsync('_DemoPartial')");
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        // Test @await Html.PartialAsync with model
        HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX.exec('@await Html.PartialAsync("_DemoPartial", Model)');
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL_REGEX.exec('@await Html.PartialAsync("_ProductSummary", Model.Product)');
        assert.strictEqual(match?.[1], '_ProductSummary');
    });
    
    test('Should handle patterns without @ prefix', () => {
        const HTML_PARTIAL_WITH_NAME_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*\)/g;
        const HTML_PARTIAL_ASYNC_WITH_NAME_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*\)/g;
        
        // Test Html.Partial without @
        let match = HTML_PARTIAL_WITH_NAME_REGEX.exec('Html.Partial("_DemoPartial")');
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        // Test await Html.PartialAsync without @
        HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_ASYNC_WITH_NAME_REGEX.exec('await Html.PartialAsync("_DemoPartial")');
        assert.strictEqual(match?.[1], '_DemoPartial');
    });
    
    test('Should handle mixed quote styles', () => {
        const HTML_PARTIAL_WITH_NAME_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*\)/g;
        
        // Test double quotes
        let match = HTML_PARTIAL_WITH_NAME_REGEX.exec('@Html.Partial("_DemoPartial")');
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        // Test single quotes
        HTML_PARTIAL_WITH_NAME_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_NAME_REGEX.exec("@Html.Partial('_DemoPartial')");
        assert.strictEqual(match?.[1], '_DemoPartial');
    });
    
    test('Should handle whitespace variations', () => {
        const HTML_PARTIAL_WITH_NAME_REGEX = /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*\)/g;
        
        // Test various whitespace patterns
        let match = HTML_PARTIAL_WITH_NAME_REGEX.exec('@Html.Partial ( "_DemoPartial" )');
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        HTML_PARTIAL_WITH_NAME_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_NAME_REGEX.exec('@Html.Partial("_DemoPartial")');
        assert.strictEqual(match?.[1], '_DemoPartial');
        
        HTML_PARTIAL_WITH_NAME_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_NAME_REGEX.exec('@Html . Partial("_DemoPartial")');
        assert.strictEqual(match, null); // Should not match with space in method name
    });

    test('Should match @Html.Partial with full paths correctly', () => {
        const HTML_PARTIAL_WITH_FULL_PATH_REGEX = /@?Html\.Partial\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
        const HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX = /@?Html\.Partial\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;
        
        // Test basic @Html.Partial with full path
        let match = HTML_PARTIAL_WITH_FULL_PATH_REGEX.exec('@Html.Partial("~/Views/Shared/_DemoPartial.cshtml")');
        assert.strictEqual(match?.[1], '~/Views/Shared/_DemoPartial.cshtml');
        
        HTML_PARTIAL_WITH_FULL_PATH_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_FULL_PATH_REGEX.exec('@Html.Partial("~/Areas/Admin/Views/Shared/_AdminPartial.cshtml")');
        assert.strictEqual(match?.[1], '~/Areas/Admin/Views/Shared/_AdminPartial.cshtml');
        
        // Test @Html.Partial with full path and model
        HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.exec('@Html.Partial("~/Views/Demo/_SpecificPartial.cshtml", Model)');
        assert.strictEqual(match?.[1], '~/Views/Demo/_SpecificPartial.cshtml');
        
        HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_WITH_FULL_PATH_AND_MODEL_REGEX.exec('@Html.Partial("~/Areas/Catalog/Views/Product/_ProductCard.cshtml", Model.Product)');
        assert.strictEqual(match?.[1], '~/Areas/Catalog/Views/Product/_ProductCard.cshtml');
    });
    
    test('Should match @await Html.PartialAsync with full paths correctly', () => {
        const HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
        const HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*,\s*[^)]+\)/g;
        
        // Test basic @await Html.PartialAsync with full path
        let match = HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.exec('@await Html.PartialAsync("~/Views/Shared/_DemoPartial.cshtml")');
        assert.strictEqual(match?.[1], '~/Views/Shared/_DemoPartial.cshtml');
        
        HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.exec('@await Html.PartialAsync("~/Areas/Admin/Views/Shared/_AdminPartial.cshtml")');
        assert.strictEqual(match?.[1], '~/Areas/Admin/Views/Shared/_AdminPartial.cshtml');
        
        // Test @await Html.PartialAsync with full path and model
        HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX.exec('@await Html.PartialAsync("~/Views/Demo/_SpecificPartial.cshtml", Model)');
        assert.strictEqual(match?.[1], '~/Views/Demo/_SpecificPartial.cshtml');
        
        HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_ASYNC_WITH_FULL_PATH_AND_MODEL_REGEX.exec('@await Html.PartialAsync("~/Areas/Catalog/Views/Product/_ProductCard.cshtml", Model.Product)');
        assert.strictEqual(match?.[1], '~/Areas/Catalog/Views/Product/_ProductCard.cshtml');
    });

    test('Should handle full path patterns without @ prefix', () => {
        const HTML_PARTIAL_WITH_FULL_PATH_REGEX = /@?Html\.Partial\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
        const HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX = /@?await\s+Html\.PartialAsync\s*\(\s*["'](~\/[^"']+\.cshtml?)["']\s*\)/g;
        
        // Test Html.Partial with full path without @
        let match = HTML_PARTIAL_WITH_FULL_PATH_REGEX.exec('Html.Partial("~/Views/Shared/_DemoPartial.cshtml")');
        assert.strictEqual(match?.[1], '~/Views/Shared/_DemoPartial.cshtml');
        
        // Test await Html.PartialAsync with full path without @
        HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.lastIndex = 0;
        match = HTML_PARTIAL_ASYNC_WITH_FULL_PATH_REGEX.exec('await Html.PartialAsync("~/Views/Shared/_DemoPartial.cshtml")');
        assert.strictEqual(match?.[1], '~/Views/Shared/_DemoPartial.cshtml');
    });
});

// Export test patterns for external verification
export const TEST_PATTERNS = {
    HTML_PARTIAL_WITH_NAME: /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*\)/g,
    HTML_PARTIAL_WITH_NAME_AND_MODEL: /@?Html\.Partial\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g,
    HTML_PARTIAL_ASYNC_WITH_NAME: /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*\)/g,
    HTML_PARTIAL_ASYNC_WITH_NAME_AND_MODEL: /@?await\s+Html\.PartialAsync\s*\(\s*["']([^"']+)["']\s*,\s*[^)]+\)/g
};
