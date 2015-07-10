# Blob class

Gives access to an individual binary block stored in the system.

## Methods 

* Promise<Buffer> loadContent()    - access to the content of this blob
* Blob newRevision(Buffer content) - creates and returns a new content blob

## Table "vc_blob"

This table contains binary content. Gives access to the content by the unique
identifier and by the content hash (SHA-1 hash).

* long blobId     - PK; unique blob identifier; platform-depending value
* String hash     - hash of the physically stored content
* long length     - length of the physically stored content
* Buffer content  - Buffer object allowing to read the content
    
## Table "vc_revisions"
 
This table contains mapping of an individual content revisions to the main and
diff blobs. The Blob class loads the main content buffer and the diff buffer to
restore a real content buffer. 

* long revisionId - PK; unique revision identifier; platform-depending  
* long length     - length of the restored content; main content + applied patch
* String hash     - the SHA-1 hash of the restored content; 40 bytes; not null
* long contentId  - reference to vc_blob.blobId; reference to the main content;
                    not null;   
* long diffId     - reference to vc_blob.blobId; reference to the buffer
                    containing patch

