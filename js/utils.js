export const utils = {
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substring(2),
    
    formatDate: (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' };
        return new Date(dateString).toLocaleDateString('tr-TR', options);
    },

    // YENİ EKLENEN: Metin içindeki linkleri tıklanabilir <a> etiketine çevirir
    linkify: (text) => {
        if (!text) return '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank" style="text-decoration: underline; color: #4a90e2; font-weight: bold;">${url}</a>`;
        });
    }
};